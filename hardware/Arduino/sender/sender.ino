
//https://github.com/pangcrd/LVGL_Bassic-tutorial/tree/main/ESP32_UART_JSON/Source%20code/Master


#define NoSensors 2              // quanti sensori
#include <Arduino.h>
#include "ArduinoJson.h"
#include "soc/rtc.h"   // set CPU frequency

//*************************
//**** HX711 load cells ***
//*************************


#include "HX711r.h"

HX711 scale;

// HX711 circuit wiring
const int LOADCELL_DOUT_PIN = 4;
const int LOADCELL_SCK_PIN  = 25;

const int CalData[8][2] = {
  // Crea un Array con i valori da richiamare in base al canale Y scelto
  // offset, calibrazione
  { -419460, -52000 }, // sensore 1,  the value it shows with weight removed / value shown with set_scale(0) / known weight
  { -237480,  50000 }, // sensore 2
  { 0, 1 }, // sensore 3
  { 0, 1 }, // sensore 4
  { 0, 1 }, // sensore 5
  { 0, 1 }, // sensore 6
  { 0, 1 }, // sensore 7
  { 0, 1 }  // sensore 8
};

#define DELAYTIME 250

//********************
//**** Meshtastic ****
//********************


#define MESH_BAUD 115200

// Define the RX and TX pins for Serial 2 to Meshtastic
#define RXD2 16
#define TXD2 17

// Create an instance of the HardwareSerial class for Serial 2
HardwareSerial meshSerial(2);

String receivedMessage = "";  // Variable to store the complete message


//********************
//**** deep sleep ****
//********************


#define uS_TO_S_FACTOR           1000000ULL      // Conversion factor for micro seconds to seconds (ULL = unsigned long long)
#define OSC_TOLERANCE            0.5             // adjustment for oscillator deviation
#define TIME_TO_SLEEP_H          0               // time to sleep hours
#define TIME_TO_SLEEP_M          60               // time to sleep minutes
#define TIME_TO_SLEEP            TIME_TO_SLEEP_H*60*(60+OSC_TOLERANCE) + TIME_TO_SLEEP_M*(60+OSC_TOLERANCE)   // Time ESP32 will go to sleep
#define TIME_TO_BE_AWAKE         20              // Time ESP32 will stay awake (in seconds)
uint32_t wake_time = 0;
#define BUTTON_PIN_BITMASK(GPIO) (1ULL << GPIO)  // 2 ^ GPIO_NUMBER in hex
#define USE_EXT0_WAKEUP          1               // 1 = EXT0 wakeup, 0 = EXT1 wakeup
#define WAKEUP_GPIO              GPIO_NUM_13     // Only RTC IO are allowed - ESP32 Pin example


//*******************
//**** DHT sensor ***
//*******************


#include "DHT.h"
#include <DHT_U.h>

#define DHTPIN 4     // Digital pin connected to the DHT sensor

// Uncomment whatever type you're using!
//#define DHTTYPE DHT11   // DHT 11
#define DHTTYPE DHT22   // DHT 22  (AM2302), AM2321
//#define DHTTYPE DHT21   // DHT 21 (AM2301)

// Initialize DHT sensor.
// Note that older versions of this library took an optional third parameter to
// tweak the timings for faster processors.  This parameter is no longer needed
// as the current DHT reading algorithm adjusts itself to work on faster procs.
DHT dht(DHTPIN, DHTTYPE);


//*********************
//**** Multiplexer ****
//*********************


const int SPin[4] = {18, 23, 19, 22}; // 4 Pin usati per inviare il codice binario
// const int EPin = 2; /* Pin Enable
//                      - se impostato HIGH interrotto fisicamente il collegamento tra il pin SIG e quello Yxx scelto
//                      - se impostato LOW viene stabilito il collegamento tra il pin SIG e quello Yxx scelto */

// const int SIG = 9; // SIG pin

const int STable[16][4] = {
  // Crea un Array con i valori binari da richiamare in base al canale Y scelto
  // s0, s1, s2, s3, canale
  {0,  0,  0,  0}, // Y0  sensore 1 temperatura, umidita
  {1,  0,  0,  0}, // Y1  sensore 1 peso
  {0,  1,  0,  0}, // Y2  sensore 2 temperatura, umidita
  {1,  1,  0,  0}, // Y3  sensore 2 peso
  {0,  0,  1,  0}, // Y4  sensore 3 temperatura, umidita
  {1,  0,  1,  0}, // Y5  sensore 3 peso
  {0,  1,  1,  0}, // Y6  sensore 4 temperatura, umidita
  {1,  1,  1,  0}, // Y7  sensore 4 peso
  {0,  0,  0,  1}, // Y8  sensore 5 temperatura, umidita
  {1,  0,  0,  1}, // Y9  sensore 5 peso
  {0,  1,  0,  1}, // Y10 sensore 6 temperatura, umidita
  {1,  1,  0,  1}, // Y11 sensore 6 peso
  {0,  0,  1,  1}, // Y12 sensore 7 temperatura, umidita
  {1,  0,  1,  1}, // Y13 sensore 7 peso
  {0,  1,  1,  1}, // Y14 sensore 8 temperatura, umidita
  {1,  1,  1,  1}  // Y15 sensore 8 peso
};

int sensorTable[8][2] = {
  // Crea un Array con la presenzia dei sensori
  // DHT22, HX711
  {1,  1}, // sensore 1
  {1,  1}, // sensore 2
  {1,  1}, // sensore 3
  {1,  1}, // sensore 4
  {1,  1}, // sensore 5
  {1,  1}, // sensore 6
  {1,  1}, // sensore 7
  {1,  1}  // sensore 8
};
bool sensorPresent = false;

void YSelect(int Y){
  digitalWrite(SPin[0], STable[Y][0]);
  digitalWrite(SPin[1], STable[Y][1]);
  digitalWrite(SPin[2], STable[Y][2]);
  digitalWrite(SPin[3], STable[Y][3]);
}

float   w;                 // variables for weight (get_units) 
float   h, t;              // variables for humidity and temperature
uint8_t sensorNo;          // sensor number
uint8_t s;                 // variable for sensor
esp_sleep_wakeup_cause_t wakeup_reason;

//****************
//**** wakeup ****
//****************

/*
  Method to print the reason by which ESP32
  has been awaken from sleep
*/
void print_wakeup_reason() {

  wakeup_reason = esp_sleep_get_wakeup_cause();

  switch (wakeup_reason) {
    case ESP_SLEEP_WAKEUP_EXT0:     Serial.println("Wakeup caused by external signal using RTC_IO");         /*  meshSerial.println("Wakeup caused by external signal using RTC_IO");   */        break;
    case ESP_SLEEP_WAKEUP_EXT1:     Serial.println("Wakeup caused by external signal using RTC_CNTL");       /*  meshSerial.println("Wakeup caused by external signal using RTC_CNTL");  */       break;
    case ESP_SLEEP_WAKEUP_TIMER:    Serial.println("Wakeup caused by timer");                                /*  meshSerial.println("Wakeup caused by timer");                           */       break;
    case ESP_SLEEP_WAKEUP_TOUCHPAD: Serial.println("Wakeup caused by touchpad");                             /*  meshSerial.println("Wakeup caused by touchpad");                         */      break;
    case ESP_SLEEP_WAKEUP_ULP:      Serial.println("Wakeup caused by ULP program");                          /*  meshSerial.println("Wakeup caused by ULP program");                      */      break;
    default:                        Serial.printf("Wakeup was not caused by deep sleep: %d\n", wakeup_reason);/* meshSerial.printf("Wakeup was not caused by deep sleep: %d\n", wakeup_reason); */ break;
  }
}

//**********************
//**** JSON message ****
//**********************


void dataPacketCreate(){
  JsonDocument mydata;            //create json document

  for (int i = 0 ; i < 3 ; i++){ 
    if (sensorTable[i][1] == 1 ) {
      Serial.print("canale ");
      Serial.print(2*i + 1);
      Serial.print(" per il peso di sensore ");
      Serial.println(i + 1);
      YSelect(2*i+1); // modificare il valore da 0 a 15 per scegliere quale pin Y selezionare
      delay(DELAYTIME);
        scale.power_up();
        delay(400);
        scale.set_gain(128);
        scale.set_offset(CalData[i][0]);  // offset
        scale.set_scale(CalData[i][1]);   // calibration
        scale.set_median_mode();
        delay(DELAYTIME);
     
      if (scale.is_ready()) {
        w = scale.get_units(20);
        Serial.print("Il peso è ");
        Serial.print(w);
        Serial.print(" kg");
        scale.power_down(); 
        Serial.println();  
      } else {
        Serial.print ("HX711 not found ");
        Serial.print(i+1);
        Serial.println();
        meshSerial.println("HX711 not found");
        sensorTable[i][1]=0;
      }
    }

    if (sensorTable[i][0] == 1 ) {
      Serial.print("canale ");
      Serial.print(2*i);
      Serial.println(" per temperatura e humidita");
      YSelect(2*i); // modificare il valore da 0 a 15 per scegliere quale pin Y selezionare
      delay(DELAYTIME);
  
      // Reading temperature or humidity takes about 250 milliseconds!
      // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
      // Read temperature as Celsius (the default)
      Serial.print("Lastresult (dht.read(true)): ");
      if(dht.read(true)) {
        Serial.println("true");
      } else {
        Serial.println("False");
      }
      delay(DELAYTIME);
      h = dht.readHumidity(true);
      delay(DELAYTIME);
      t = dht.readTemperature();
      // Check if any reads failed and exit early (to try again).
      if (isnan(h) || isnan(t)) {
        Serial.print(F("Failed to read from DHT sensor "));
        Serial.print(2*i);
        Serial.println(F(" !"));
        meshSerial.println("DHT22 not found");
        sensorTable[i][0]=0;
    //   delay(2000);
    //    return;
      } else {
        Serial.print(F("Humidity: "));
        Serial.print(h);
        Serial.print(F("%  Temperature: "));
        Serial.print(t);
        Serial.println(F("°C "));
      }
    }

    if ((sensorTable[i][0]==1) && (sensorTable[i][1]==1)) {
      sensorPresent=true;
      Serial.print("create JSON data for sensor ");
      Serial.print(i);
      Serial.println();

      String output;

      mydata["sensor"] = i+1;
      mydata["humidity"] = h;
      mydata["temperature"] = t;
      mydata["weight"] = w;
      serializeJson(mydata, output); // add mydata to output send to serial

      for (int j = 0; j < 4; j++){   // we make 4 transmissions
        meshSerial.println(output);  // print data to meshtastic
        delay(1000);
      }
      
      Serial.println(output);        // print json data to serial monitor
      Serial.println();
      Serial.println("spedito");

//      delay(2000);
    } else {
      Serial.print("sensor ");
      Serial.print(i+1);
      Serial.println(" not present");
    }

  Serial.println();
  Serial.println();
  }
  if (!sensorPresent) {
    Serial.println("sensor error on HX711 or DHT22");
    meshSerial.println("sensor error on HX711 or DHT22");
  } else {
    sensorPresent = false;
  }
}


void setup() {
  Serial.begin(115200);

 
//Slow down the ESP32 processor
  rtc_cpu_freq_config_t config;
  rtc_clk_cpu_freq_get_config(&config);
  rtc_clk_cpu_freq_mhz_to_config(RTC_XTAL_FREQ_40M, &config);
  rtc_clk_cpu_freq_set_config_fast(&config);
  delay(DELAYTIME);


   // modificare il valore da 0 a 15 per scegliere quale pin Y selezionare
  YSelect(1);     //sensore 1 peso

  dht.begin();

  // Start the HX711 sensor
  // Initialize library with data output pin, clock input pin and gain factor.
  // Channel selection is made by passing the appropriate gain:
  // - With a gain factor of 64 or 128, channel A is selected
  // - With a gain factor of 32, channel B is selected
  // By omitting the gain factor parameter, the library
  // default "128" (Channel A) is used here.
  // scale.set_gain(128) (or 64) for channel A
  // scale.set_gain(32)          for channel B
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

  // Multiplexer gpio as output
  for (int i = 0; i < 4; i++)
  {
    pinMode(SPin[i], OUTPUT); // Inizializza tutti gli Spin come OUTPUT
    digitalWrite(SPin[i], LOW); // Setta tutti gli Spin LOW
  }

  // Meshtastic communication
  // Start Serial 2 with the defined RX and TX pins and a baud rate of 115200
  meshSerial.begin(MESH_BAUD, SERIAL_8N1, RXD2, TXD2);
  Serial.println("Serial 2 started at 115200 baud rate");

  //Print the wakeup reason for ESP32
  print_wakeup_reason();


// prepare deep sleep

#if USE_EXT0_WAKEUP
  esp_sleep_enable_ext0_wakeup(WAKEUP_GPIO, 1);  //1 = High, 0 = Low
  // Configure pullup/downs via RTCIO to tie wakeup pins to inactive level during deepsleep.
  // EXT0 resides in the same power domain (RTC_PERIPH) as the RTC IO pullup/downs.
  // No need to keep that power domain explicitly, unlike EXT1.
  gpio_pullup_dis(WAKEUP_GPIO);
  gpio_pulldown_en(WAKEUP_GPIO);
#else  // EXT1 WAKEUP
  //If you were to use ext1, you would use it like
  esp_sleep_enable_ext1_wakeup_io(BUTTON_PIN_BITMASK(WAKEUP_GPIO), ESP_EXT1_WAKEUP_ANY_HIGH);
  /*
    If there are no external pull-up/downs, tie wakeup pins to inactive level with internal pull-up/downs via RTC IO
         during deepsleep. However, RTC IO relies on the RTC_PERIPH power domain. Keeping this power domain on will
         increase some power comsumption. However, if we turn off the RTC_PERIPH domain or if certain chips lack the RTC_PERIPH
         domain, we will use the HOLD feature to maintain the pull-up and pull-down on the pins during sleep.
  */
  gpio_pulldown_en(WAKEUP_GPIO);  // GPIO33 is tie to GND in order to wake up in HIGH
  gpio_pullup_dis(WAKEUP_GPIO);   // Disable PULL_UP in order to allow it to wakeup on HIGH
#endif

  // First we configure the wake up source. We set our ESP32 to wake up every x seconds
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  Serial.println("Setup ESP32 to sleep for every " + String(TIME_TO_SLEEP) + " Seconds");

  wake_time = millis() + TIME_TO_BE_AWAKE * 1000;

  delay(DELAYTIME);   //for stabilisation of DHT22 before taking values
  dataPacketCreate();
  Serial.println("JSON data packet creation done");
}



void loop() {
  // going to sleep
  if (millis() >= wake_time){
    wake_time = millis() + TIME_TO_BE_AWAKE * 1000;
    
    //Go to sleep now
//    meshSerial.println("Vado a dormire.");
    Serial.println("Going to sleep now");
    Serial.println();
    esp_deep_sleep_start();
    Serial.println("This will never be printed");
  }
}

/*
 offste auf 0
 calib auf 1
 ohne gewicht messen
 Wert als offset nehmen
 mit gewicht messen
 Wert durch bekanntes gewicht teilen und als calib nehmen
  
*/





#include "soc/rtc.h"   // set CPU frequency


// https://www.makerslab.it/cd74hc4067-16-channel-analog-multiplexer-demultiplexer/

const int SPin[4] = {18,23,19,22}; // 4 Pin usati per inviare il codice binario
/*const int EPin = 0; /* Pin Enable
                      - se impostato HIGH interrotto fisicamente il collegamento tra il pin SIG e quello Yxx scelto
                      - se impostato LOW viene stabilito il collegamento tra il pin SIG e quello Yxx scelto */

// const int SIG = 4; // SIG pin

const int STable[16][4] = {
  // Crea un Array con i valori binari da richiamare in base al canale Y scelto
  // s0, s1, s2, s3, canale
  {0,  0,  0,  0}, // Y0
  {1,  0,  0,  0}, // Y1
  {0,  1,  0,  0}, // Y2
  {1,  1,  0,  0}, // Y3
  {0,  0,  1,  0}, // Y4
  {1,  0,  1,  0}, // Y5
  {0,  1,  1,  0}, // Y6
  {1,  1,  1,  0}, // Y7
  {0,  0,  0,  1}, // Y8
  {1,  0,  0,  1}, // Y9
  {0,  1,  0,  1}, // Y10
  {1,  1,  0,  1}, // Y11
  {0,  0,  1,  1}, // Y12
  {1,  0,  1,  1}, // Y13
  {0,  1,  1,  1}, // Y14
  {1,  1,  1,  1}  // Y15
};

void YSelect(int Y){
  digitalWrite(SPin[0], STable[Y][0]);
  digitalWrite(SPin[1], STable[Y][1]);
  digitalWrite(SPin[2], STable[Y][2]);
  digitalWrite(SPin[3], STable[Y][3]);
}

/*
  Rui Santos
  Complete project details at https://RandomNerdTutorials.com/arduino-load-cell-hx711/
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files.
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
*/

// Calibrating the load cell
#include "HX711.h"

// Sensor begin
//#define OFFSET   0    // the value it shows with weight removed
//#define CALIB    1   // value shown with set_scale(0) / known weight

// Sensor 1
//#define OFFSET   -419460    // the value it shows with weight removed
//#define CALIB    -52   // value shown with set_scale(0) / known weight

// Sensor 2
#define OFFSET   -237480    // the value it shows with weight removed
#define CALIB    50   // value shown with set_scale(0) / known weight


// HX711 circuit wiring
const int LOADCELL_DOUT_PIN = 4;
const int LOADCELL_SCK_PIN = 25;

HX711 scale;

void setup() {
  Serial.begin(115200);
//Slow down the ESP32 processor
  rtc_cpu_freq_config_t config;
  rtc_clk_cpu_freq_get_config(&config);
  rtc_clk_cpu_freq_mhz_to_config(RTC_XTAL_FREQ_40M, &config);
  rtc_clk_cpu_freq_set_config_fast(&config);

  delay(250);
  for (int i = 0; i < 4; i++)
  {
    pinMode(SPin[i], OUTPUT); // Inizializza tutti gli Spin come OUTPUT
    digitalWrite(SPin[i], LOW); // Setta tutti gli Spin LOW
  }

// sensor 1
//  YSelect(1); // modificare il valore da 0 a 15 per scegliere quale pin Y selezionare

// sensor 2  
  YSelect(3); // modificare il valore da 0 a 15 per scegliere quale pin Y selezionare

  delay(250);
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  delay(250);
  scale.power_up();
  delay(250);
  scale.set_gain(128);
  delay(250);
}

void loop() {

  if (scale.is_ready()) {
    scale.set_offset(OFFSET);  // set 0 to start / first offset
    scale.set_scale(CALIB);   // set -1 to start
//    Serial.println("Tare... remove any weights from the scale.");
//    delay(10000);
//    scale.tare();
    delay(250);
//    Serial.println("Tare done...");
    Serial.print("Place a known weight on the scale...");
//    delay(2000);
    float reading = scale.get_units(20);
//    Serial.print("Result: ");
    Serial.println(reading);
    Serial.print(float(reading)/1000, 2);
    Serial.println(" kg");
  } 
  else {
    Serial.println("HX711 not found.");
  }
  delay(1000);
}

//calibration factor will be the (reading)/(known weight)

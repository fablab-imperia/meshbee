// Board: ESP32 ver.: 1.0.6 !!!
// Wemos Lolin 32 lite

//https://github.com/tzapu/WiFiManager/blob/master/examples/Parameters/SPIFFS/AutoConnectWithFSParameters/AutoConnectWithFSParameters.ino
//https://github.com/pangcrd/LVGL_Bassic-tutorial/blob/main/ESP32_UART_JSON/Source%20code/Slave/main.cpp

//#define WILLY

#include <WiFiManager.h> 
#include <Arduino.h>
#include "ArduinoJson.h"
#include <PubSubClient.h>
#include "credentials.h"

//const char* ssid = "xxx";   // your network SSID (name) 
//const char* password = "xxx";   // your network password

WiFiClient  espClient;


PubSubClient client(espClient);
long lastMsg = 0;
char msg[50];
int value = 0;

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  String messageTemp;
  
  for (int i = 0; i < length; i++) {
    Serial.print((char)message[i]);
    messageTemp += (char)message[i];
  }
  Serial.println();

  // Feel free to add more if statements to control more GPIOs with MQTT

  // If a message is received on the topic esp32/output, you check if the message is either "on" or "off". 
  // Changes the output state according to the message
  if (String(topic) == "esp32/output") {
    Serial.print("Changing output to ");
    if(messageTemp == "on"){
      Serial.println("on");
//      digitalWrite(ledPin, HIGH);
    }
    else if(messageTemp == "off"){
      Serial.println("off");
//      digitalWrite(ledPin, LOW);
    }
  }
}
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("ESP32Client","device","device_mqtt_pass")) {
      Serial.println("connected");
      // Subscribe
      client.subscribe("esp32/output");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

/** Create struct for data packet */
typedef struct Data{
  uint8_t sensor;
  float   weight;
  float   humidity;
  float   temperature;
} Data;

Data myValues;

bool updated = false;

uint32_t rec_timer = millis();   // time period in which the same message could arrive;
String prevNode, prevSensor;

// Define the RX and TX pins for Serial 2
#define RXD2 16
#define TXD2 17

#define MESH_BAUD 115200

// Create an instance of the HardwareSerial class for Serial 2
HardwareSerial meshSerial(2);

String receivedMessage = "";  // Variable to store the complete message

// Timer variables
unsigned long lastTime = 0;
unsigned long timerDelay = 30000;



//** Receive JSON and parse from Master 
void RecvJsonData(){

  char theme[20];
 
  //** Read and check json character 
  while (meshSerial.available()){ 
    char input [150], inputNew[150], node[10], garbage[5];  // buffer large enough to store json data
    int len = meshSerial.readBytesUntil('}', input, sizeof(input)-2); // read json data until new line
    meshSerial.readBytes(garbage, 4);  // because we read only until '}' and the serial buffer is not empty
  
    Serial.print("input: ");
    Serial.println(input);
    Serial.println();

    input [len] = '}'; //close symbol json
    input [len+1] = '\0'; //null terminate
    Serial.print("input with proper ending: ");
    Serial.println(input);
    Serial.println();

    if (input[8] == '{') {
      for (int i = 0; i < len+1 ; i++) {
        inputNew[i] = input[i + 8];  
      } 
      
      for ( int j = 0; j <4  ; j++ ) {
        node[j] = input[j + 2];
      }
      node [4] = '\0'; //null terminate
//      Serial.print("Node: ");

// topic beehive/<nodo>/data
      strcpy (theme, "beehive/");
      strcat (theme, node);
      strcat (theme, "/data");
      Serial.print("theme: ");
      Serial.println(theme);
   } else {
      for (int i = 0; i < len+1 ; i++) {
        inputNew[i] = input[i];  
      } 
    }
    Serial.print("inputNew: ");
    Serial.println(inputNew);
    Serial.println();
    JsonDocument RecvData, SendData;
    DeserializationError error = deserializeJson(RecvData, inputNew);
    if (!error){
      myValues.sensor = RecvData["sensor"];
      Serial.print ("Sensor: "); Serial.println(myValues.sensor);
      char sensString[8];
      dtostrf(myValues.sensor, 1, 0, sensString);

      myValues.weight = RecvData["weight"];
      Serial.print ("Weight: "); Serial.println(myValues.weight);
      // set the fields with the values
      char weighString[8];
      dtostrf(myValues.weight, 1, 2, weighString);

      myValues.temperature = RecvData["temperature"];
      Serial.print ("Temperature: "); Serial.println(myValues.temperature);
      // set the fields with the values
      char tempString[8];
      dtostrf(myValues.temperature, 1, 2, tempString);

      myValues.humidity = RecvData["humidity"];
      Serial.print ("Humidity: "); Serial.println(myValues.humidity);
      // set the fields with the values
      char humString[8];
      dtostrf(myValues.humidity, 1, 2, humString);
    

      char output[100];
      SendData["id_nodo"] =     node;            // {"id_nodo": "fcf1",                    20 Zeichen
      SendData["id_sensore"] =  sensString;      // "id_sensore": "1",                     18 Zeichen                    
      SendData["temperatura"] = tempString;      // "temperatura": 20.0,                   20 Zeichen
      SendData["umidita"] =     humString;       // "umidita": 55.0,                       16 Zeichen
      SendData["peso"] =        weighString;     // "peso": 70.0}                          13 Zeichen  
      serializeJson(SendData, output);           // add mydata to output send to serial    87 Zeichen

      // spedire solo un dei 4 messagi spedito con la distanza di 1 secondo con id nodo e id sensore diversi
      Serial.println(millis() - rec_timer);
      if ((millis() - rec_timer >= 60000) || ((String(node) != prevNode) || (String(sensString) != prevSensor)) ){
        rec_timer = millis();
        client.publish(theme, output);
        updated=true;
        prevNode   = String(node);
        prevSensor = String(sensString);
      }
    } else {
      Serial.println("Deserealization error");
    }
  }  
}

void setup(){
//  WiFi.mode(WIFI_STA); // explicitly set mode, esp defaults to STA+AP
  // it is a good practice to make sure your code sets wifi mode how you want it.

  // Serial Monitor
  Serial.begin(115200);
  delay(1000);
    
  // Start Serial 2 with the defined RX and TX pins and a baud rate of 115200
  meshSerial.begin(MESH_BAUD, SERIAL_8N1, RXD2, TXD2);
  Serial.println("Serial 2 started at 115200 baud rate");
  
  WiFiManager wifiManager;
  wifiManager.setConfigPortalTimeout(120); // auto close configportal after n seconds
  
    // reset settings - wipe stored credentials for testing
    // these are stored by the esp library
    //wm.resetSettings();

    // Automatically connect using saved credentials,
    // if connection fails, it starts an access point with the specified name ( "AutoConnectAP"),
    // if empty will auto generate SSID, if password is blank it will be anonymous AP (wm.autoConnect())
    // then goes into a blocking loop awaiting configuration and will return success result

  bool res;
  res = wifiManager.autoConnect(ssid);
//    res = wm.autoConnect("AutoConnectAP","password"); // password protected ap
  if(!res) {
    Serial.println("Failed to connect or hit timeout");
    // ESP.restart();
  } 
  else {
    //if you get here you have connected to the WiFi    
    Serial.println("connected...yeey :)");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  }
  
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

//  ThingSpeak.begin(client);  // Initialize ThingSpeak
}

void loop() {

  RecvJsonData();

  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  if (updated) {
//    Serial.println(updated);
  }
  if ((millis() - lastTime) > timerDelay) {
    
    // Connect or reconnect to WiFi
    if(WiFi.status() != WL_CONNECTED){
      Serial.print("Attempting to connect");
      while(WiFi.status() != WL_CONNECTED){
        WiFi.begin(ssid, password); 
        delay(5000);     
      } 
      Serial.println("\nConnected.");
    }
    lastTime = millis();
  }
}

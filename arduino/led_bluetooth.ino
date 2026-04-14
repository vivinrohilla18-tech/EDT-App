/*
 * EDT LED Controller - Arduino Code
 * -----------------------------------
 * Controls an LED via:
 *   1. HC-05 Bluetooth  → Phone app (Android APK)
 *   2. USB Serial       → Web app (browser on laptop)
 *
 * Wiring:
 *   HC-05 VCC  -> 5V
 *   HC-05 GND  -> GND
 *   HC-05 TX   -> Arduino Pin 10 (RX)
 *   HC-05 RX   -> Arduino Pin 11 (TX) via voltage divider
 *   LED (+)    -> Arduino Pin 13 (built-in LED)
 *   LED (-)    -> GND (with 220Ohm resistor)
 *
 * Commands (from both app and web):
 *   '1' -> LED ON
 *   '0' -> LED OFF
 */

#include <SoftwareSerial.h>

SoftwareSerial bluetooth(10, 11); // RX=10, TX=11

const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);       // USB Serial — for web browser
  bluetooth.begin(9600);    // HC-05 — for phone app

  Serial.println("EDT LED Controller ready.");
  Serial.println("Commands: '1' = ON, '0' = OFF");
}

void loop() {
  // Read from USB Serial (web browser on laptop)
  if (Serial.available()) {
    char cmd = Serial.read();
    handleCommand(cmd);
  }

  // Read from Bluetooth HC-05 (phone app)
  if (bluetooth.available()) {
    char cmd = bluetooth.read();
    handleCommand(cmd);
  }
}

void handleCommand(char cmd) {
  if (cmd == '1') {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("LED ON");
    bluetooth.println("LED ON");
  } else if (cmd == '0') {
    digitalWrite(LED_PIN, LOW);
    Serial.println("LED OFF");
    bluetooth.println("LED OFF");
  }
}

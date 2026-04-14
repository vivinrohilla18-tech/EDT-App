/*
 * EDT LED Controller - Arduino Code
 * -----------------------------------
 * Controls an LED via HC-05 Bluetooth module.
 *
 * Wiring:
 *   HC-05 VCC  -> 5V
 *   HC-05 GND  -> GND
 *   HC-05 TX   -> Arduino Pin 10 (RX)
 *   HC-05 RX   -> Arduino Pin 11 (TX) via voltage divider
 *   LED (+)    -> Arduino Pin 13 (built-in LED)
 *   LED (-)    -> GND (with 220Ω resistor)
 *
 * Commands from app:
 *   '1' -> LED ON
 *   '0' -> LED OFF
 */

#include <SoftwareSerial.h>

SoftwareSerial bluetooth(10, 11); // RX=10, TX=11

const int LED_PIN = 13;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.begin(9600);       // USB serial (for debugging)
  bluetooth.begin(9600);    // HC-05 default baud rate

  Serial.println("EDT LED Controller ready.");
  Serial.println("Waiting for Bluetooth commands...");
}

void loop() {
  if (bluetooth.available()) {
    char cmd = bluetooth.read();

    if (cmd == '1') {
      digitalWrite(LED_PIN, HIGH);
      Serial.println("LED ON");
    } else if (cmd == '0') {
      digitalWrite(LED_PIN, LOW);
      Serial.println("LED OFF");
    }
  }
}

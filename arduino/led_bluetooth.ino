/*
 * EDT Traffic Light Controller - Arduino Code
 * ---------------------------------------------
 * Controls a 3-LED traffic light via:
 *   1. HC-05 Bluetooth  -> Phone app (Android APK)
 *   2. USB Serial       -> Web app (browser on laptop)
 *
 * Wiring:
 *   RED    LED -> Pin 11 -> 220Ohm resistor -> GND
 *   YELLOW LED -> Pin 12 -> 220Ohm resistor -> GND
 *   GREEN  LED -> Pin 13 -> 220Ohm resistor -> GND
 *   HC-05 VCC  -> 5V
 *   HC-05 GND  -> GND
 *   HC-05 TX   -> Pin 10 (RX)
 *   HC-05 RX   -> Pin 9  (TX) via voltage divider
 *
 * Commands:
 *   'R' -> Red ON
 *   'Y' -> Yellow ON
 *   'G' -> Green ON
 *   'A' -> Auto cycle mode (Red -> Yellow -> Green)
 *   'X' -> All OFF
 */

#include <SoftwareSerial.h>

SoftwareSerial bluetooth(10, 9); // RX=10, TX=9

const int RED_PIN    = 11;
const int YELLOW_PIN = 12;
const int GREEN_PIN  = 13;

bool autoMode = false;
unsigned long lastChange = 0;
int autoStep = 0; // 0=Red, 1=Yellow, 2=Green

// Auto cycle timings (milliseconds)
const int RED_TIME    = 3000;
const int YELLOW_TIME = 1000;
const int GREEN_TIME  = 3000;
const int STEP_TIMES[3] = {RED_TIME, YELLOW_TIME, GREEN_TIME};

void setup() {
  pinMode(RED_PIN, OUTPUT);
  pinMode(YELLOW_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  allOff();

  Serial.begin(9600);
  bluetooth.begin(9600);

  Serial.println("EDT Traffic Light Controller ready.");
  Serial.println("Commands: R=Red  Y=Yellow  G=Green  A=Auto  X=Off");
}

void loop() {
  // Check USB Serial (web browser)
  if (Serial.available()) {
    handleCommand(Serial.read());
  }

  // Check Bluetooth (phone app)
  if (bluetooth.available()) {
    handleCommand(bluetooth.read());
  }

  // Auto cycle logic
  if (autoMode) {
    unsigned long now = millis();
    if (now - lastChange >= (unsigned long)STEP_TIMES[autoStep]) {
      autoStep = (autoStep + 1) % 3;
      showStep(autoStep);
      lastChange = now;
    }
  }
}

void handleCommand(char cmd) {
  switch (cmd) {
    case 'R': case 'r':
      autoMode = false;
      allOff();
      digitalWrite(RED_PIN, HIGH);
      Serial.println("RED ON");
      bluetooth.println("RED ON");
      break;

    case 'Y': case 'y':
      autoMode = false;
      allOff();
      digitalWrite(YELLOW_PIN, HIGH);
      Serial.println("YELLOW ON");
      bluetooth.println("YELLOW ON");
      break;

    case 'G': case 'g':
      autoMode = false;
      allOff();
      digitalWrite(GREEN_PIN, HIGH);
      Serial.println("GREEN ON");
      bluetooth.println("GREEN ON");
      break;

    case 'A': case 'a':
      autoMode = true;
      autoStep = 0;
      lastChange = millis();
      showStep(0);
      Serial.println("AUTO MODE");
      bluetooth.println("AUTO MODE");
      break;

    case 'X': case 'x':
      autoMode = false;
      allOff();
      Serial.println("ALL OFF");
      bluetooth.println("ALL OFF");
      break;
  }
}

void showStep(int step) {
  allOff();
  if (step == 0) digitalWrite(RED_PIN, HIGH);
  else if (step == 1) digitalWrite(YELLOW_PIN, HIGH);
  else if (step == 2) digitalWrite(GREEN_PIN, HIGH);
}

void allOff() {
  digitalWrite(RED_PIN, LOW);
  digitalWrite(YELLOW_PIN, LOW);
  digitalWrite(GREEN_PIN, LOW);
}

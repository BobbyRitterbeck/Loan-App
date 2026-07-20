# Results from Cypress robot vs human test 1:

## First robot test results (types all three fields normal keystrokes):

#3 · password · 10 keystrokes · unknown
{
  "fieldId": "password",
  "totalKeystrokes": 10,
  "averageIntervalMs": 46.666666666666664,
  "minIntervalMs": 46.099999994039536,
  "maxIntervalMs": 47.29999998211861,
  "inputType": "password",
  "dominantInputType": "unknown",
  "msFromFocusToFirstInput": 54.80000001192093,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": false
}
#2 · email · 22 keystrokes · unknown
{
  "fieldId": "email",
  "totalKeystrokes": 22,
  "averageIntervalMs": 36.96666666723433,
  "minIntervalMs": 36.20000001788139,
  "maxIntervalMs": 37.80000001192093,
  "inputType": "email",
  "dominantInputType": "unknown",
  "msFromFocusToFirstInput": 56.30000001192093,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": false
}
#1 · username · 10 keystrokes · unknown
{
  "fieldId": "username",
  "totalKeystrokes": 10,
  "averageIntervalMs": 42.81111111243566,
  "minIntervalMs": 41.099999994039536,
  "maxIntervalMs": 48.099999994039536,
  "inputType": "text",
  "dominantInputType": "unknown",
  "msFromFocusToFirstInput": 54.29999998211861,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": false
}

## Second robot test results (pastes email, types username and password)":

#3 · password · 10 keystrokes · unknown
{
  "fieldId": "password",
  "totalKeystrokes": 10,
  "averageIntervalMs": 33.022222224209045,
  "minIntervalMs": 32,
  "maxIntervalMs": 34.400000005960464,
  "inputType": "password",
  "dominantInputType": "unknown",
  "msFromFocusToFirstInput": 57.400000005960464,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": false
}
#2 · email · 0 keystrokes · insertFromPaste
{
  "fieldId": "email",
  "totalKeystrokes": 0,
  "averageIntervalMs": null,
  "minIntervalMs": null,
  "maxIntervalMs": null,
  "inputType": "email",
  "dominantInputType": "insertFromPaste",
  "msFromFocusToFirstInput": 49124.20000001788,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": true
}
#1 · username · 10 keystrokes · unknown
{
  "fieldId": "username",
  "totalKeystrokes": 10,
  "averageIntervalMs": 31.9222222202354,
  "minIntervalMs": 30.900000005960464,
  "maxIntervalMs": 32.5,
  "inputType": "text",
  "dominantInputType": "unknown",
  "msFromFocusToFirstInput": 55.29999998211861,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": false
}

## Third robot test results (Fills all three fields instantly; scripted/untrusted):

Typing velocity metrics
3
#3 · password · 0 keystrokes · insertText
{
  "fieldId": "password",
  "totalKeystrokes": 0,
  "averageIntervalMs": null,
  "minIntervalMs": null,
  "maxIntervalMs": null,
  "inputType": "password",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 90578.80000001192,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": true
}
#2 · email · 0 keystrokes · insertText
{
  "fieldId": "email",
  "totalKeystrokes": 0,
  "averageIntervalMs": null,
  "minIntervalMs": null,
  "maxIntervalMs": null,
  "inputType": "email",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 90577.69999998808,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": true
}
#1 · username · 0 keystrokes · insertText
{
  "fieldId": "username",
  "totalKeystrokes": 0,
  "averageIntervalMs": null,
  "minIntervalMs": null,
  "maxIntervalMs": null,
  "inputType": "text",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 90577.29999998212,
  "hasUntrustedInput": true,
  "inputWithoutKeydown": true
}

## Human Input field test results (typed normally):

### Human Typing 1:

#3 · password · 8 keystrokes · insertText
{
  "fieldId": "password",
  "totalKeystrokes": 8,
  "averageIntervalMs": 214.52857143112593,
  "minIntervalMs": 199.7999999821186,
  "maxIntervalMs": 231.2000000178814,
  "inputType": "password",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 591.4000000059605,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}
#2 · email · 25 keystrokes · insertText
{
  "fieldId": "email",
  "totalKeystrokes": 25,
  "averageIntervalMs": 156.375,
  "minIntervalMs": 47.19999998807907,
  "maxIntervalMs": 391,
  "inputType": "email",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 937.4000000059605,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}
#1 · username · 10 keystrokes · insertText
{
  "fieldId": "username",
  "totalKeystrokes": 10,
  "averageIntervalMs": 168.4222222202354,
  "minIntervalMs": 40.69999998807907,
  "maxIntervalMs": 608.0999999940395,
  "inputType": "text",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 527.9000000059605,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}

### Human Typing 2:

#3 · password · 8 keystrokes · insertText
{
  "fieldId": "password",
  "totalKeystrokes": 8,
  "averageIntervalMs": 216,
  "minIntervalMs": 185.80000001192093,
  "maxIntervalMs": 243.69999998807907,
  "inputType": "password",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 490.7999999821186,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}
#2 · email · 27 keystrokes · insertText
{
  "fieldId": "email",
  "totalKeystrokes": 27,
  "averageIntervalMs": 188.07692307692307,
  "minIntervalMs": 52.30000001192093,
  "maxIntervalMs": 782.4000000059605,
  "inputType": "email",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 557.6999999880791,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}
#1 · username · 10 keystrokes · insertText
{
  "fieldId": "username",
  "totalKeystrokes": 10,
  "averageIntervalMs": 119.60000000066228,
  "minIntervalMs": 51.599999994039536,
  "maxIntervalMs": 245,
  "inputType": "text",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 600.4000000059605,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}

### Human Typing 3:

#3 · password · 8 keystrokes · insertText
{
  "fieldId": "password",
  "totalKeystrokes": 8,
  "averageIntervalMs": 233.24285714115416,
  "minIntervalMs": 165.69999998807907,
  "maxIntervalMs": 290.10000002384186,
  "inputType": "password",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 499.5,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}
#2 · email · 23 keystrokes · insertText
{
  "fieldId": "email",
  "totalKeystrokes": 23,
  "averageIntervalMs": 148.04999999972907,
  "minIntervalMs": 20.19999998807907,
  "maxIntervalMs": 464,
  "inputType": "email",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 528.6999999880791,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}
#1 · username · 10 keystrokes · insertText
{
  "fieldId": "username",
  "totalKeystrokes": 10,
  "averageIntervalMs": 140.53333333465787,
  "minIntervalMs": 40.599999994039536,
  "maxIntervalMs": 344.09999999403954,
  "inputType": "text",
  "dominantInputType": "insertText",
  "msFromFocusToFirstInput": 508.59999999403954,
  "hasUntrustedInput": false,
  "inputWithoutKeydown": false
}
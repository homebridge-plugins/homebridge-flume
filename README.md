# homebridge-flume

# Configuration

Configuration sample:

```
"accessories": [
  {
    "accessory": "Flume",
    "name": "Flume Water Monitor",
    "username": "user@domain.com",
    "password": "password",
    "client_id": "12345678901234567890",
    "client_secret": "1234567890",
    "polling_minutes": 1,
    "handicap": 0.1,
    "valveType": 3
  }
]
```

Fields:

- "accessory": Must always be "Flume" (required)
- "username": Your username for accessing the Flume site at https://portal.flumetech.com/ (required)
- "password": Your password for accessing the Flume site (required)
- "client_id": Your Client ID for API access, found in Settings on the Flume site (required)
- "client_secret": Your Client Secret for API access, found in Settings on the Flume site (required)
- "polling_minutes": Number of minutes between updates. Defaults to 1 minute. API has a cap of 120 calls per hour. (optional)
- "handicap": Set to ignore a steady water draw below this value. Defaults to zero (0.0) gallons. (optional)

# Retrieving API Login Credentials

You'll need to get your API Access Client ID and Client Secret from Flume's site at https://portal.flumetech.com/
This guide offers the steps to take: https://flumetech.readme.io/reference#accessing-the-api

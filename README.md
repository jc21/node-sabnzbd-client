# SABnzbd NodeJS API Client

Let's be honest, the [official SABnzbd API](https://sabnzbd.org/wiki/advanced/api) implementation is weird. I've never seen anything like it. That's why I've written this
client. It's more than a simple wrapper. It tries to demystify the weirdness and conform to something a little more standard as
far as API's go.

A few things to mention:

- This is a *native* Promise based library. None of this *Bluebird* crap.
- You'll need a newish version of NodeJS supporting ECMAscript 6 (2015). NodeJS 6+ should be fine. I refuse to write code for older versions.
Don't be afraid to upgrade. 

## Installation

```bash
npm install sabnzbd-client
```

## Usage

```javascript
const sabnzbd = require('sabnzbd-client');
const client  = new sabnzbd('http://localhost:8080', 'YOUR_SAB_API_KEY');

// Set the speed limit
client.setSpeedLimit('200K')
    .then(res => {
        console.log('RESPONSE:', res);
    })
    .catch(err => {
        console.error(err.message);
    });
```

## Methods



### version

Returns the SABnzbd version as a string. This doesn't actually require an API key

**Return Values**

*{String}*

**Example**

```javascript
client.version()
    .then(version => {
        console.log('Sab Version:', version);
        // Sab Version: 2.2.1
    })
    .catch(err => {
        console.error(err.message);
    });
```



### queue

Returns the SABnzbd queue either in full or as a subset

**Parameters**

- *{Integer}* [start]
- *{Integer}* [limit]
- *{String}* [search]

**Return Values**

*{Object}*

**Example**

```javascript
client.version(2, 10, 'thrones')
    .then(queue => {
        console.log('Queue:', queue);
    })
    .catch(err => {
        console.error(err.message);
    });
```


### pauseQueue

Pauses the Queue indefinitely or for specified minutes

**Parameters**

- *{Integer}* [minutes]

**Return Values**

*{Boolean}*

**Example**

```javascript
client.pauseQueue(15)
    .then(success => {
        console.log('Success:', success);
    })
    .catch(err => {
        console.error(err.message);
    });
```


### resumeQueue

Resumes the Queue

**Return Values**

*{Boolean}*

**Example**

```javascript
client.resumeQueue()
    .then(success => {
        console.log('Success:', success);
    })
    .catch(err => {
        console.error(err.message);
    });
```


### speedLimit

Sets the Speed Limit for downloads. Limit can be one of the following values:

- A number between 1 and 100, which would set as the percentage of the limit set in your configs
- A Kilobyte per second limit, ie: `400K`
- A Megabyte per second limit, ie: `2M`

Note: In SABnzbd 0.7.20 and below the value is always interpreted as KB/s, no percentages.

**Parameters**

- *{String|Integer}* limit

**Return Values**

*{Boolean}*

**Example**

```javascript
client.speedLimit('250K')
    .then(success => {
        console.log('Success:', success);
    })
    .catch(err => {
        console.error(err.message);
    });
```


### onQueueComplete

Sets the action to take when the queue is done. The action string can be one of the following:

- `hibernate_pc`
- `standby_pc`
- `shutdown_program`
- Script: prefix the name of the script with `script_` ie: `script_test.py`

**Parameters**

- *{String}* action

**Return Values**

*{Boolean}*

**Example**

```javascript
client.onQueueComplete('hibernate_pc')
    .then(success => {
        console.log('Success:', success);
    })
    .catch(err => {
        console.error(err.message);
    });
```



### sortQueue

Sorts the queue by the following fields in either ascending or descending order: 

- `avg_age`
- `name`
- `size`

Direction can be either:

- `asc` - Ascending
- `desc` - Descending

with `asc` being default.

**Parameters**

- *{String}* field
- *{String}* [direction]

**Return Values**

*{Boolean}*

**Example**

```javascript
client.sortQueue('name', 'desc')
    .then(success => {
        console.log('Success:', success);
    })
    .catch(err => {
        console.error(err.message);
    });
```



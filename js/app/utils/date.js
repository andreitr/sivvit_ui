// Formats date
Date.prototype.format = function() {
  return this.getMonth() + 1 + '/' + this.getDate() + '/' + String(this.getFullYear()).substr(2, 2) + ' ' + this.getHours() + ':' + this.getMinutes() + ':' + this.getSeconds();
};

// Date from the server is returned in seconds
Date.secondsToDate = function(seconds) {
  return new Date(seconds * 1000);
};
// Converts date object to seconds
Date.dateToSeconds = function(date) {
  return Math.round(date.getTime() / 1000);
};

Date.plusSecond = function(date) {
  if(date.getSeconds() === 59) {
    return Date.plusMinute(new Date(date.setSeconds(0)));
  } else {
    return new Date(date.setSeconds(date.getSeconds() + 1));
  }
};

Date.plusMinute = function(date) {

  if(date.getMinutes() === 59) {
    return Date.plusHour(new Date(date.setMinutes(0)));
  } else {
    return new Date(date.setMinutes(date.getMinutes() + 1));
  }
};

Date.plusHour = function(date) {

  if(date.getHours() === 23) {
    return Date.plusDay(new Date(date.setHours(0)));
  } else {
    return new Date(date.setHours(date.getHours() + 1));
  }
};

Date.plusDay = function(date) {

  if(date.getDate() === Date.daysInMonth(date.getMonth(), date.getFullYear())) {
    return Date.plusMonth(new Date(date.setDate(1)));
  } else {
    return new Date(date.setDate(date.getDate() + 1));
  }
};

Date.plusMonth = function(date) {
  if(date.getMonth() === 11) {
    return Date.plusYear(new Date(date.setMonth(0)));
  } else {
    return new Date(date.setMonth(date.getMonth() + 1));
  }
};

Date.plusYear = function(date) {
  return new Date(new Date(date.setFullYear(date.getFullYear() + 1)));
};

Date.minusSecond = function(date) {
  if(date.getSeconds() === 0) {
    return Date.minusMinute(new Date(date.setSeconds(59)));
  } else {
    return new Date(date.setSeconds(date.getSeconds() - 1));
  }
};

Date.minusMinute = function(date) {
  if(date.getMinutes() === 0) {
    return Date.minusHour(new Date(date.setMinutes(59)));
  } else {
    return new Date(date.setMinutes(date.getMinutes() - 1));
  }
};

Date.minusHour = function(date) {

  if(date.getHours() === 0) {
    return Date.minusDay(new Date(date.setHours(23)));
  } else {
    return new Date(date.setHours(date.getHours() - 1));
  }
};

Date.minusDay = function(date) {

  if(date.getDate() === 1) {
    return Date.minusMonth(new Date(date.setDate(Date.daysInMonth(date.getMonth(), date.getFullYear()))));
  } else {
    return new Date(date.setDate(date.getDate() - 1));
  }
};

Date.minusMonth = function(date) {

  if(date.getMonth() === 0) {
    return Date.minusYear(new Date(date.setMonth(11)));
  } else {
    return new Date(date.setMonth(date.getMonth() - 1));
  }
};

Date.minusYear = function(date) {
  return new Date(new Date(date.setFullYear(date.getFullYear() - 1)));
};

// Returns the number of days for a given month
Date.daysInMonth = function(m, y) {
  return 32 - new Date(y, m, 32).getDate();
};

// Formats date
Date.prototype.format = function() {
  return this.getMonth() + 1 + '/' + this.getDate() + '/' + String(this.getFullYear()).substr(2,2) + ' ' + this.getHours() + ':' + this.getMinutes() + ':' + this.getSeconds();
};

// Date from the server is returned in seconds
Date.parseCustomDate = function(seconds) {
  return new Date(seconds * 1000);
};
// Converts date object to seconds
Date.toSeconds = function(date) {
  return Number(date.getTime() / 1000);
};

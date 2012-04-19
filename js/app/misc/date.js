// Formats date
Date.prototype.format = function() {
  return this.getMonth() + 1 + "/" + this.getDate() + "/" + this.getFullYear() + " " + this.getHours() + ":" + this.getMinutes() + ":" + this.getSeconds();
};

// Date from the server is returned in seonds
Date.parseCustomDate = function(seconds) {
  return new Date(seconds * 1000);
};

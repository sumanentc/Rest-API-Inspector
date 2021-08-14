(function (xhr) {
  const XHR = XMLHttpRequest.prototype;

  const open = XHR.open;
  const send = XHR.send;
  const setRequestHeader = XHR.setRequestHeader;

  XHR.open = function () {
    this._requestHeaders = {};

    return open.apply(this, arguments);
  };

  XHR.setRequestHeader = function (header, value) {
    this._requestHeaders[header] = value;
    return setRequestHeader.apply(this, arguments);
  };

  XHR.send = function () {
    this.addEventListener("load", function () {
      const url = this.responseURL;
      const responseHeaders = this.getAllResponseHeaders();
      //const reqBody = this.requestBody();
      try {
        if (this.responseType != "blob") {
          let responseBody;
          if (this.responseType === "" || this.responseType === "text") {
            responseBody = JSON.parse(this.responseText);
          } else if (this.responseType === "json") {
            responseBody = this.response;
          }
          console.log("url:::: + " + url);
          console.log("body:::: ");
          console.log(responseBody);
          console.log("headers:::: ");
          console.log(responseHeaders);
          console.log(this);
        }
      } catch (err) {
        console.debug("Error reading or processing response.", err);
      }
    });
    console.log("arguments");
    console.log(arguments);
    console.log(this);
    return send.apply(this, arguments);
  };
})(XMLHttpRequest);

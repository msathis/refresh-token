var request = require('request');

/**
 * Create a new instance of TokenProvider
 *
 * @param {String} url url to get the access token
 * @param {Object} options
 * @return {TokenProvider}
 * 
 * options are: 
 *  refresh_token 
 *  client_id 
 *  client_secret
 *  
 *  optionals  
 *    access_token
 *    expires_in
 */
function TokenProvider (url, options) {
  if(!(this instanceof TokenProvider)){
    //when calling as a function, force new.
    return new TokenProvider(url, options);
  }

  if(!url){
    throw new Error('missing url parameter');
  }

  ['refresh_token', 'client_id', 'client_secret'].forEach(function (k) {
    if(!(k in options)){
      throw new Error('missing ' + k + ' parameter');
    }
  });

  this.url = url;
  this.options = options;
  
  if(this.options.access_token){
    this.currentToken = {
      access_token:    this.options.access_token,
      expires_in:      this.options.expires_in,
      expires_in_date: this.options.expires_in_date
    };
  }

  if(this.currentToken && 'expires_in' in this.currentToken) {
    this.currentToken.expires_in_date = new Date(new Date().getTime() + (this.currentToken.expires_in * 1000));
  }
}

/**
 * Return a valid access token.
 * 
 * If the current access token is expired,
 * fetch a new one.
 * 
 * @param  {Function} done
 */
TokenProvider.prototype.getToken = function (done) {
  if(this.currentToken && this.currentToken.expires_in_date > new Date()){
    return done(null, this.currentToken.access_token);
  }

  request.post({
    url: this.url,
    form: {
      refresh_token: this.options.refresh_token,
      client_id:     this.options.client_id,
      client_secret: this.options.client_secret,
      grant_type:    'refresh_token'
    }
  }, function (err, response, body) {

    if(err) return done(err);

    this.currentToken = JSON.parse(body);

    this.currentToken.expires_in_date = 
      new Date((new Date()).getTime() +  this.currentToken.expires_in * 1000);

    return done(null, this.currentToken.access_token);

  }.bind(this));
};

module.exports = TokenProvider;

module.exports.GoogleTokenProvider = 
  TokenProvider.bind(null, 'https://accounts.google.com/o/oauth2/token');
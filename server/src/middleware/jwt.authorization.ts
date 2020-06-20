let jwt = require('jsonwebtoken');
const secret = 'thisisnot7wonders';

function createToken(username: string): any {
  let token: any = jwt.sign({username: username},
    secret,
    { expiresIn: '24h' }
  );
  return token;
}

function getAppCookies(req: any): any {
  const rawCookies: any = req.headers.cookie.split('; ');
  const parsedCookies: any = {};
  rawCookies.forEach((rawCookie: any) =>{
    const parsedCookie: string[] = rawCookie.split('=');
    parsedCookies[parsedCookie[0]] = parsedCookie[1];
  });
  return parsedCookies;
}

function checkToken(req: any): any {
  let token: string = getAppCookies(req).token;
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  if (token) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      return
    }
  }
}

module.exports = {
  checkToken,
  createToken
}
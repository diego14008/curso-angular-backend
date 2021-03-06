const jwt = require('jsonwebtoken');

const generarJWT = (uid) => {
  return new Promise( (resolve, reject) => {
    /**se firmara el uid */
    const payload = {
      uid
    };
  /**sign es para crearlo */
    jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '12h'
    }, (err, token) => {
      if(err) {
        console.log(err);
        reject('No se pudo generar el JWT.');
      } else {
        resolve(token);
      }
    });
  });
}

module.exports = {
  generarJWT
}
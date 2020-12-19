const { response } = require('express');
const Usuario = require('../models/usuario');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');


const login = async(req, res = response) => {
  const { email, password } = req.body;
  try {
    /**verificar email */
    const usuarioDB = await Usuario.findOne({email});
    if (!usuarioDB) {
      return res.status(400).json({
        ok: false,
        msg: 'El usuario no existe.' /**Email no encontrado. */
      });
    }

    /**verificar contraseña */
    const validPassword = bcrypt.compareSync(password, usuarioDB.password);
    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        msg: 'La contraseña no es válida.'
      });
    }

    /**generar token JWT */
    const token = await generarJWT(usuarioDB.id)

    res.json({
      ok: true,
      msg: 'Usuario '+usuarioDB.email+' autenticado.',
      token
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Hable con el administrador.'
    });
  }
}

module.exports = {
  login
}
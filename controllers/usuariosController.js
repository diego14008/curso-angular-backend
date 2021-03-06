const { response } = require('express');
const bcrypt = require('bcryptjs');
const publicIp = require('public-ip');
const ip2loc = require("ip2location-nodejs");
const { generarJWT } = require('../helpers/jwt');

ip2loc.IP2Location_init("./IP2LOCATION-LITE-DB1.BIN");

/**importando mis modelos */
const Usuario = require('../models/usuario')

const getUsuarios = async(req, res) => {
  const desde = Number(req.query.desde) || 0;
  /**si en la url no ponen DESDE http://localhost:3005/api/usuarios toma de 0 y arroja 5 filas */

  // const lstUsuarios = await Usuario.find({enabled: '1'},'nombre email role enabled google').skip(desde).limit(5);
  // const total_reg = await Usuario.count();

  const [ usuarios, total_reg ] = await Promise.all([
    Usuario.find({enabled: '1'},'nombre email role foto enabled google').skip(desde).limit(5),
    Usuario.countDocuments()
  ]);

  res.json({
    ok: true,
    usuarios,
    total_reg
    // uid: req.uid
  });
}

const crearUsuario = async(req, res = response) => {
  const { email,password,nombre } = req.body;

  try {
    const existeEmail = await Usuario.findOne({ email });

    if(existeEmail) {
      return res.status(400).json({
        ok: false,
        msg: 'El email ingresado ya esta registrado.'
      });
    }

    const ip = await publicIp.v4();

    const usuario = new Usuario(req.body)
    /**encriptar contraseña */
    const salt = bcrypt.genSaltSync();
    usuario.password = bcrypt.hashSync(password, salt);
    usuario.myIP = ip;
    usuario.pais = ip2loc.IP2Location_get_all(ip).country_short;
    usuario.codePais = ip2loc.IP2Location_get_all(ip).country_long;

    /**generar token JWT */
    const token = await generarJWT(usuario.id);
    
    await usuario.save(); /**es una promesa, puede q lo haga rapido o demore */

    res.json({
      ok: true,
      msg: 'Usuario creado con éxito.',
      usuario: usuario,
      token
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({
      ok: false,
      msg: 'Error al crear usuario.'
    })
  }
}

const actualizarUsuario = async(req, res = response) => {
  /**validar token y comprobar si el usuario es correcto */
  const uid = req.params.id;
  try {
    const usuarioDB = await Usuario.findById(uid);
    if(!usuarioDB) {
      return res.status(404).json({
        ok: false,
        msg: 'No existe un usuario con ese ID en la DB.'
      })
    }

    /**actualizar data */
    const { password, google, email, ...campos } = req.body; /**desestructuramos lo q viene en el request body, campos q no se usaran para actualizar */
    if(usuarioDB.email != email) {
      const existeEmail = await Usuario.findOne({ email });
      if (existeEmail) {
        return res.status(400).json({
          ok: false,
          msg: 'Ya existe un usuario con ese email.'
        });
      }
    }
    /**actualiza si NO es un usuario de google */
    if(!usuarioDB.google) {
      campos.email = email; /**email a actualizar */
    } else if(usuarioDB.email != email) {
      return res.status(400).json({
        ok: false,
        msg: 'Usario de Google no pueden cambiar su correo.'
      });
    }
    /**campos q no desea actualizar
     * esto lo desestructuramos en line 63
    */
    // delete campos.password;
    // delete campos.google;

    /**te arroja el usuario antes de actualizar, agregar new: true */
    /**ver min 13 */
    const usuarioActualizado = await Usuario.findByIdAndUpdate(uid, campos, {new: true});


    res.json({
      ok: true,
      msg: 'Se actualizó el usuario correctamente.',
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      msg: 'Error al actualizar usuario'
    })
  }
}

const borrarUsuario = async(req, res = response) => {
  const uid = req.params.id;

  try {
    const usuarioDB = await Usuario.findById(uid);
    if(!usuarioDB) {
      return res.status(404).json({
        ok: false,
        msg: 'No existe un usuario con ese ID en la DB.'
      })
    }
    
    if (usuarioDB.enabled === '1') {
      await Usuario.findByIdAndUpdate(uid, {enabled: '0'}, {new: true});
      res.json({
        ok: true,
        msg: 'Usuario deshabilitado.'
      });
    } else {
      await Usuario.findByIdAndUpdate(uid, {enabled: '1'}, {new: true});
      res.json({
        ok: true,
        msg: 'Usuario habilitado.'
      });
    }
    // await Usuario.findByIdAndDelete(uid);
  } catch (error) {
    res.status(500).json({
      ok: false,
      msg: 'error al borrar usuario.' 
    });
  }
}

module.exports = {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  borrarUsuario
}
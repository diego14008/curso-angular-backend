/**
 * ruta -> /api/hospitales
 * */
const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');

const { getHospitales, crearHospital, actualizarHospital, borrarHospital } = require('../controllers/hospitalController');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.get("/", getHospitales);

router.post(
  "/",
  [
    validarJWT,
    check('nombre', 'El nombre del hospital es obligatorio.').not().isEmpty(),
    validarCampos
  ],
  crearHospital
);

router.put(
  "/:id",
  [
  ],
  actualizarHospital
);

router.delete("/:id", borrarHospital);

/**exportamos el router */
module.exports = router;
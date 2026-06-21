const jwt = require('jsonwebtoken');

const getTestToken = (_, res) => {
  try {
    const payload = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      nombre: 'Usuario Prueba',
      rol: 'facturador'
    };

    const token = jwt.sign(payload, 'clave_secreta_compartida_entre_modulos', {
      expiresIn: '24h',
      algorithm: process.env.JWT_ALGORITHM || 'HS256'
    });

    return res.status(200).json({
      status: "ok",
      token: token
    });

  } catch (error) {
    console.error("Error generando token de prueba:", error);
    return res.status(500).json({
      status: "error",
      message: "No se pudo generar el token de prueba"
    });
  }
};

module.exports = {
  getTestToken
};
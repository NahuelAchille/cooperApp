// Los roles, por su número en la tabla `roles` (los carga database.sql).
//
// Estaban escritos a mano en varios lugares: ID_ROL_ADMIN en el registro,
// ID_ROL_ADMIN_EMPRESA en usuarios (el mismo número con dos nombres),
// `id_rol = 1` en las consultas de empresas y `[2, 3]` en el alta de usuarios
// (revisión de código, 14/11/2026). Si un día cambian, cambian acá.
const ROL = {
  ADMIN_EMPRESA: 1,
  TESORERO: 2,
  OPERADOR: 3,
  SUPERADMIN: 4
}

// Los que el administrador de una empresa puede darle a sus usuarios. No
// incluye admin_empresa ni superadmin: nadie se promueve a sí mismo ni crea
// administradores desde la pantalla de usuarios.
const ROLES_ASIGNABLES = [ROL.TESORERO, ROL.OPERADOR]

module.exports = { ROL, ROLES_ASIGNABLES }

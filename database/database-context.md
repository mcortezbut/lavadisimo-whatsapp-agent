# Contexto de Base de Datos - Lavadísimo

## Tablas Disponibles

### ASISTENCIA

**Columnas:**
- **IDASISTENCIA**: bigint NOT NULL
- **FECHA**: datetime NOT NULL
- **IDTURNO**: int NOT NULL
- **IDCTEUPDATE**: int NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **BONIFICACION**: bigint NULL

**Datos de ejemplo:**
```json
[
  {
    "IDASISTENCIA": "1",
    "FECHA": "2025-05-23T18:02:13.757Z",
    "IDTURNO": 2,
    "IDCTEUPDATE": 6324,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "BONIFICACION": null
  },
  {
    "IDASISTENCIA": "2",
    "FECHA": "2025-05-23T18:03:40.090Z",
    "IDTURNO": 2,
    "IDCTEUPDATE": 6632,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "BONIFICACION": null
  },
  {
    "IDASISTENCIA": "3",
    "FECHA": "2025-05-23T18:11:15.803Z",
    "IDTURNO": 2,
    "IDCTEUPDATE": 6517,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "BONIFICACION": null
  }
]
```

---

### CATEGORIAS

**Columnas:**
- **IDGRUPO**: int NOT NULL
- **NOMCAT**: nvarchar(36) NOT NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **IDCTEUPDATE**: int NOT NULL
- **FECHAUPDATE**: datetime NOT NULL

**Datos de ejemplo:**
```json
[
  {
    "IDGRUPO": 6,
    "NOMCAT": "CORTINAS Y VISILLOS",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1,
    "FECHAUPDATE": "2024-08-10T13:51:28.077Z"
  },
  {
    "IDGRUPO": 7,
    "NOMCAT": "SOFAS Y SILLAS",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1,
    "FECHAUPDATE": "2024-08-10T13:52:34.793Z"
  },
  {
    "IDGRUPO": 8,
    "NOMCAT": "COLCHONES",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1,
    "FECHAUPDATE": "2024-08-10T13:53:02.313Z"
  }
]
```

---

### CLIENTES

**Columnas:**
- **IDCTE**: int NOT NULL
- **NOMCTE**: nvarchar(36) NOT NULL
- **CELCTE**: bigint NOT NULL
- **DIRCTE**: nvarchar(50) NULL
- **TIPO**: int NULL
- **OBSCTE**: nvarchar(80) NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **USERPASS**: nvarchar(36) NULL
- **IDCTEUPDATE**: int NULL
- **FECHAUPDATE**: datetime NOT NULL
- **BUSQUEDA**: nvarchar(150) NULL
- **PAGOBONO**: datetime NULL

**Datos de ejemplo:**
```json
[
  {
    "IDCTE": 6581,
    "NOMCTE": "JORGE COLLAO MARCE",
    "CELCTE": "945769306",
    "DIRCTE": "ENRIQUE LIHN 4332 COLINAS DEL MILAGRO",
    "TIPO": 1,
    "OBSCTE": "0",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "USERPASS": "",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-04-22T16:08:10.913Z",
    "BUSQUEDA": "JORGE COLLAO MARCE945769306ENRIQUE LIHN 4332 COLINAS DEL MILAGRO",
    "PAGOBONO": null
  },
  {
    "IDCTE": 6582,
    "NOMCTE": "SILVIA GARCIA ROJAS",
    "CELCTE": "940827123",
    "DIRCTE": "MIRAMAR 4881",
    "TIPO": 1,
    "OBSCTE": "0",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "USERPASS": "",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-04-22T20:05:26.183Z",
    "BUSQUEDA": "SILVIA GARCIA ROJAS940827123MIRAMAR 4881",
    "PAGOBONO": null
  },
  {
    "IDCTE": 6583,
    "NOMCTE": "GLENDA SOLANO RODRIGUEZ",
    "CELCTE": "939648041",
    "DIRCTE": "",
    "TIPO": 1,
    "OBSCTE": "0",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "USERPASS": "",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-04-23T14:22:49.867Z",
    "BUSQUEDA": "GLENDA SOLANO RODRIGUEZ939648041",
    "PAGOBONO": null
  }
]
```

---

### COMPRAS

**Columnas:**
- **NROCOMPRA**: bigint NOT NULL
- **NROFACTURA**: bigint NULL
- **TOTAL**: bigint NOT NULL
- **FECHA**: datetime NOT NULL
- **MPAGO**: int NOT NULL
- **TIPO**: int NOT NULL
- **IDCTE**: int NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **IDCTEUPDATE**: int NULL
- **FECHAUPDATE**: datetime NOT NULL
- **IDCAJA**: nvarchar(50) NULL

**Datos de ejemplo:**
```json
[
  {
    "NROCOMPRA": "1",
    "NROFACTURA": "0",
    "TOTAL": "64330",
    "FECHA": "2025-08-15T17:19:47.647Z",
    "MPAGO": 2,
    "TIPO": 0,
    "IDCTE": 6835,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-08-15T17:19:47.647Z",
    "IDCAJA": "PC0"
  },
  {
    "NROCOMPRA": "2",
    "NROFACTURA": "9501097",
    "TOTAL": "25310",
    "FECHA": "2025-08-18T17:15:55.347Z",
    "MPAGO": 2,
    "TIPO": 0,
    "IDCTE": 6840,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-08-18T17:15:55.347Z",
    "IDCAJA": "PC1"
  },
  {
    "NROCOMPRA": "3",
    "NROFACTURA": "0",
    "TOTAL": "150610",
    "FECHA": "2025-08-18T17:23:41.250Z",
    "MPAGO": 2,
    "TIPO": 0,
    "IDCTE": 6841,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-08-18T17:23:41.250Z",
    "IDCAJA": "PC1"
  }
]
```

---

### CONVERSACIONES

**Columnas:**
- **IDCHAT**: int NOT NULL
- **CELCTE**: bigint NULL
- **TIPO**: int NULL
- **MENSAJE**: nvarchar(-1) NULL
- **FECHA**: datetime NULL
- **INTENCION**: varchar(50) NULL
- **CONTEXTO**: nvarchar(-1) NULL

**Datos de ejemplo:**
```json
[
  {
    "IDCHAT": 1,
    "CELCTE": "975754771",
    "TIPO": 0,
    "MENSAJE": "Hola q tal cuanto sale el lavado de cobertor?",
    "FECHA": "2025-08-02T17:08:32.303Z",
    "INTENCION": null,
    "CONTEXTO": null
  },
  {
    "IDCHAT": 2,
    "CELCTE": "975754771",
    "TIPO": 1,
    "MENSAJE": "Tenemos varias opciones para eso: COBERTOR SUPER KING, COBERTOR 1 1/2 PL., COBERTOR ESPECIAL 1 1/2 PL., COBERTOR 2 PL. + FUNDAS, COBERTOR 2 PL.(MAX.220 CM.). ¿Cuál te interesa específicamente?",
    "FECHA": "2025-08-02T17:08:37.150Z",
    "INTENCION": null,
    "CONTEXTO": null
  },
  {
    "IDCHAT": 3,
    "CELCTE": "982873656",
    "TIPO": 0,
    "MENSAJE": "Gracias , pasaré despues de las 15 hrs",
    "FECHA": "2025-08-04T18:11:28.817Z",
    "INTENCION": null,
    "CONTEXTO": null
  }
]
```

---

### DETALLE

**Columnas:**
- **NROVENTA**: bigint NOT NULL
- **IDDET**: bigint NOT NULL
- **IDPROD**: int NOT NULL
- **PRECIO**: bigint NOT NULL
- **FECHA**: datetime NOT NULL
- **CANT**: int NOT NULL
- **PCOSTO**: decimal NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL

**Datos de ejemplo:**
```json
[
  {
    "NROVENTA": "34864",
    "IDDET": "38431",
    "IDPROD": 18,
    "PRECIO": "20900",
    "FECHA": "2025-04-15T15:29:57.300Z",
    "CANT": 1,
    "PCOSTO": 0,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo"
  },
  {
    "NROVENTA": "34865",
    "IDDET": "38432",
    "IDPROD": 2,
    "PRECIO": "15900",
    "FECHA": "2025-04-15T15:42:23.867Z",
    "CANT": 1,
    "PCOSTO": 0,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo"
  },
  {
    "NROVENTA": "34865",
    "IDDET": "38433",
    "IDPROD": 7,
    "PRECIO": "13900",
    "FECHA": "2025-04-15T15:42:23.867Z",
    "CANT": 2,
    "PCOSTO": 0,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo"
  }
]
```

---

### DETALLECOMPRAS

**Columnas:**
- **NROCOMPRA**: bigint NOT NULL
- **IDDET**: bigint NOT NULL
- **IDPROD**: int NOT NULL
- **PRECIO**: bigint NOT NULL
- **FECHA**: datetime NOT NULL
- **CANT**: int NOT NULL
- **PCOSTO**: bigint NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL

**Datos de ejemplo:**
```json
[
  {
    "NROCOMPRA": "1",
    "IDDET": "1",
    "IDPROD": 602,
    "PRECIO": "64329",
    "FECHA": "2025-08-15T17:19:47.647Z",
    "CANT": 1,
    "PCOSTO": "0",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo"
  },
  {
    "NROCOMPRA": "2",
    "IDDET": "2",
    "IDPROD": 604,
    "PRECIO": "21271",
    "FECHA": "2025-08-18T17:15:55.347Z",
    "CANT": 1,
    "PCOSTO": "0",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo"
  },
  {
    "NROCOMPRA": "2",
    "IDDET": "3",
    "IDPROD": 601,
    "PRECIO": "4041",
    "FECHA": "2025-08-18T17:15:55.347Z",
    "CANT": 1,
    "PCOSTO": "0",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo"
  }
]
```

---

### PAGOS

**Columnas:**
- **NROPAGO**: bigint NOT NULL
- **NROVENTA**: bigint NOT NULL
- **TOTAL**: bigint NOT NULL
- **FECHA**: datetime NOT NULL
- **MPAGO**: int NOT NULL
- **IDCTE**: int NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **IDCTEUPDATE**: int NULL
- **FECHAUPDATE**: datetime NOT NULL
- **IDCAJA**: nvarchar(50) NULL

**Datos de ejemplo:**
```json
[
  {
    "NROPAGO": "474",
    "NROVENTA": "34667",
    "TOTAL": "48700",
    "FECHA": "2025-04-15T17:08:23.013Z",
    "MPAGO": 2,
    "IDCTE": 6541,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-04-15T17:08:23.013Z",
    "IDCAJA": "PC2"
  },
  {
    "NROPAGO": "475",
    "NROVENTA": "34860",
    "TOTAL": "27000",
    "FECHA": "2025-04-15T17:24:48.677Z",
    "MPAGO": 2,
    "IDCTE": 5430,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-04-15T17:24:48.677Z",
    "IDCAJA": "PC1"
  },
  {
    "NROPAGO": "476",
    "NROVENTA": "34713",
    "TOTAL": "35000",
    "FECHA": "2025-04-15T18:03:44.600Z",
    "MPAGO": 2,
    "IDCTE": 1199,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-04-15T18:03:44.600Z",
    "IDCAJA": "PC2"
  }
]
```

---

### PRODUCTOS

**Columnas:**
- **IDPROD**: int NOT NULL
- **NOMPROD**: nvarchar(36) NOT NULL
- **PRECIO**: bigint NOT NULL
- **IDGRUPO**: int NULL
- **POSICION**: int NULL
- **NOMPRODBOTON**: nvarchar(16) NULL
- **TIPO**: int NULL
- **CODPROD**: nvarchar(50) NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **IDCTEUPDATE**: int NOT NULL
- **FECHAUPDATE**: datetime NOT NULL

**Datos de ejemplo:**
```json
[
  {
    "IDPROD": 123,
    "NOMPROD": "BLUSA SIMPLE",
    "PRECIO": "9800",
    "IDGRUPO": 5,
    "POSICION": 0,
    "NOMPRODBOTON": "",
    "TIPO": 1,
    "CODPROD": "",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-04-23T16:20:08.517Z"
  },
  {
    "IDPROD": 163,
    "NOMPROD": "BLUSA ESPECIAL",
    "PRECIO": "12900",
    "IDGRUPO": 5,
    "POSICION": 0,
    "NOMPRODBOTON": "",
    "TIPO": 1,
    "CODPROD": "",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-04-23T16:20:26.970Z"
  },
  {
    "IDPROD": 346,
    "NOMPROD": "MASCOTA XL ",
    "PRECIO": "16900",
    "IDGRUPO": 9,
    "POSICION": 0,
    "NOMPRODBOTON": "",
    "TIPO": 1,
    "CODPROD": "",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-04-24T14:24:21.223Z"
  }
]
```

---

### productos2

**Columnas:**
- **IDPROD**: int NOT NULL
- **NOMPROD**: nvarchar(36) NOT NULL
- **PRECIO**: bigint NOT NULL
- **IDGRUPO**: int NULL
- **POSICION**: int NULL
- **TIPO**: int NULL
- **CODPROD**: nvarchar(50) NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **IDCTEUPDATE**: int NOT NULL
- **FECHAUPDATE**: datetime NOT NULL

**Datos de ejemplo:**
```json
[
  {
    "IDPROD": 123,
    "NOMPROD": "BLUSA SIMPLE",
    "PRECIO": "9800",
    "IDGRUPO": 5,
    "POSICION": 0,
    "TIPO": 1,
    "CODPROD": "",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-04-23T16:20:08.517Z"
  },
  {
    "IDPROD": 163,
    "NOMPROD": "BLUSA ESPECIAL",
    "PRECIO": "12900",
    "IDGRUPO": 5,
    "POSICION": 0,
    "TIPO": 1,
    "CODPROD": "",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-04-23T16:20:26.970Z"
  },
  {
    "IDPROD": 346,
    "NOMPROD": "MASCOTA XL ",
    "PRECIO": "16900",
    "IDGRUPO": 9,
    "POSICION": 0,
    "TIPO": 1,
    "CODPROD": "",
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-04-24T14:24:21.223Z"
  }
]
```

---

### RELPRODUCTOS

**Columnas:**
- **IDPROD**: int NOT NULL
- **IDPROD1**: int NOT NULL
- **IDPROD2**: int NOT NULL
- **CANT1**: int NOT NULL
- **CANT2**: int NOT NULL
- **NIVEL**: int NOT NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **IDCTEUPDATE**: int NULL
- **FECHAUPDATE**: datetime NULL

**Datos de ejemplo:**
```json
[
  {
    "IDPROD": 602,
    "IDPROD1": 602,
    "IDPROD2": 602,
    "CANT1": 1,
    "CANT2": 1,
    "NIVEL": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-08-15T17:10:13.547Z"
  },
  {
    "IDPROD": 604,
    "IDPROD1": 604,
    "IDPROD2": 604,
    "CANT1": 1,
    "CANT2": 1,
    "NIVEL": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-08-18T17:02:55.400Z"
  },
  {
    "IDPROD": 605,
    "IDPROD1": 605,
    "IDPROD2": 605,
    "CANT1": 1,
    "CANT2": 1,
    "NIVEL": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 4,
    "FECHAUPDATE": "2025-08-18T17:22:04.210Z"
  }
]
```

---

### USUARIOS

**Columnas:**
- **IDUSUARIO**: nvarchar(50) NOT NULL
- **PASSWORD**: nvarchar(10) NOT NULL
- **TIPOUSUARIO**: numeric NOT NULL

**Datos de ejemplo:**
```json
[
  {
    "IDUSUARIO": "lavadisimo",
    "PASSWORD": "3473",
    "TIPOUSUARIO": 2
  },
  {
    "IDUSUARIO": "lavadisimo2",
    "PASSWORD": "3473",
    "TIPOUSUARIO": 2
  }
]
```

---

### VENTAS

**Columnas:**
- **NROVENTA**: bigint NOT NULL
- **TOTAL**: bigint NOT NULL
- **DESCUENTO**: bigint NULL
- **FECHA**: datetime NOT NULL
- **MPAGO**: int NOT NULL
- **IDCTE**: int NULL
- **NULO**: int NULL
- **IDUSUARIO**: nvarchar(50) NULL
- **IDCTEUPDATE**: int NULL
- **FECHAUPDATE**: datetime NOT NULL
- **BUSQUEDA**: nvarchar(100) NULL
- **OBSERVACION**: nvarchar(80) NULL
- **ESTADO**: int NULL
- **FECHAENTREGA**: datetime NULL
- **IDCTERET**: int NULL
- **OBSPOSTVENTA**: nvarchar(80) NULL
- **IDCAJA**: nvarchar(50) NULL
- **NPROCEDIMIENTO**: int NULL
- **PARTICIPACION**: decimal NULL
- **IDPRODPART**: int NULL
- **CANTPART**: decimal NULL
- **DOMICILIO**: int NULL

**Datos de ejemplo:**
```json
[
  {
    "NROVENTA": "34843",
    "TOTAL": "27800",
    "DESCUENTO": "0",
    "FECHA": "2025-04-14T16:49:49.000Z",
    "MPAGO": 2,
    "IDCTE": 4548,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-04-16T17:25:31.970Z",
    "BUSQUEDA": "34843HUMBERTO GALLEGUILLOS ARACENA0",
    "OBSERVACION": "URGENTE MIERCOLES 15 HRS",
    "ESTADO": 2,
    "FECHAENTREGA": "2025-04-16T04:00:00.000Z",
    "IDCTERET": 0,
    "OBSPOSTVENTA": "0",
    "IDCAJA": "PC2",
    "NPROCEDIMIENTO": 0,
    "PARTICIPACION": null,
    "IDPRODPART": 0,
    "CANTPART": null,
    "DOMICILIO": 0
  },
  {
    "NROVENTA": "34843",
    "TOTAL": "27800",
    "DESCUENTO": "0",
    "FECHA": "2025-04-14T16:49:49.000Z",
    "MPAGO": 2,
    "IDCTE": 4548,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-04-16T17:25:38.517Z",
    "BUSQUEDA": "34843HUMBERTO GALLEGUILLOS ARACENA0",
    "OBSERVACION": "URGENTE MIERCOLES 15 HRS",
    "ESTADO": 3,
    "FECHAENTREGA": "2025-04-16T04:00:00.000Z",
    "IDCTERET": 0,
    "OBSPOSTVENTA": "0",
    "IDCAJA": "PC2",
    "NPROCEDIMIENTO": 0,
    "PARTICIPACION": null,
    "IDPRODPART": 0,
    "CANTPART": null,
    "DOMICILIO": 0
  },
  {
    "NROVENTA": "34894",
    "TOTAL": "114000",
    "DESCUENTO": "0",
    "FECHA": "2025-04-16T19:52:48.247Z",
    "MPAGO": 0,
    "IDCTE": 3473,
    "NULO": 0,
    "IDUSUARIO": "lavadisimo",
    "IDCTEUPDATE": 1047,
    "FECHAUPDATE": "2025-04-16T19:52:47.950Z",
    "BUSQUEDA": " 34894MARTA TALADRIZ TOPP982326305",
    "OBSERVACION": "",
    "ESTADO": 0,
    "FECHAENTREGA": "2025-04-22T04:00:00.000Z",
    "IDCTERET": 0,
    "OBSPOSTVENTA": "0",
    "IDCAJA": "PC2",
    "NPROCEDIMIENTO": 0,
    "PARTICIPACION": null,
    "IDPRODPART": 0,
    "CANTPART": null,
    "DOMICILIO": 0
  }
]
```

---

## Relaciones entre Tablas

No se encontraron relaciones definidas explícitamente.

## Queries Útiles para el Agente

### Consultas de Productos

**Tabla: PRODUCTOS**
```sql
SELECT * FROM PRODUCTOS WHERE [columna_nombre] LIKE '%producto%'
```

**Tabla: productos2**
```sql
SELECT * FROM productos2 WHERE [columna_nombre] LIKE '%producto%'
```

**Tabla: RELPRODUCTOS**
```sql
SELECT * FROM RELPRODUCTOS WHERE [columna_nombre] LIKE '%producto%'
```


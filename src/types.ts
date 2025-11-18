export type EstadoCancha = 'ACTIVA' | 'INACTIVA' | 'MANTENIMIENTO';

export type Disciplina = {
  id: number;           // ID_TIPO_CANCHA
  nombre: string;       // NOMBRE
  descripcion?: string; // DESCRIPCION
};

export type Cancha = {
  id?: number;
  nombre: string;
  idDisciplina: number;
  valor: number;
  estado: EstadoCancha;
  horaApertura: string; // 'HH:mm'
  horaCierre: string;   // 'HH:mm'
};

export type Implemento = {
  id: number; // ID_IMPLEMENTO
  tipo: string; // TIPO_IMPLEMENTO
  estado: string; // ESTADO
  cantidad: number; // CANTIDAD
};

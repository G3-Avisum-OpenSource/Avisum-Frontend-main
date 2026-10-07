import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Driver implements BaseEntity {
  private _id: number;
  private _nombre: string;
  private _apellido: string;
  private _dni: string;
  private _codigoEmpleado: string;
  private _codigoQr: string;
  private _placa: string;
  private _estado: string;
  private _foto: string;

  constructor(props: {
    id: number; nombre: string; apellido: string; dni: string;
    codigoEmpleado: string; codigoQr: string; placa: string;
    estado: string; foto: string;
  }) {
    this._id = props.id;
    this._nombre = props.nombre;
    this._apellido = props.apellido;
    this._dni = props.dni;
    this._codigoEmpleado = props.codigoEmpleado;
    this._codigoQr = props.codigoQr;
    this._placa = props.placa;
    this._estado = props.estado;
    this._foto = props.foto;
  }

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }
  get nombre(): string { return this._nombre; }
  set nombre(v: string) { this._nombre = v; }
  get apellido(): string { return this._apellido; }
  set apellido(v: string) { this._apellido = v; }
  get dni(): string { return this._dni; }
  set dni(v: string) { this._dni = v; }
  get codigoEmpleado(): string { return this._codigoEmpleado; }
  set codigoEmpleado(v: string) { this._codigoEmpleado = v; }
  get codigoQr(): string { return this._codigoQr; }
  set codigoQr(v: string) { this._codigoQr = v; }
  get placa(): string { return this._placa; }
  set placa(v: string) { this._placa = v; }
  get estado(): string { return this._estado; }
  set estado(v: string) { this._estado = v; }
  get foto(): string { return this._foto; }
  set foto(v: string) { this._foto = v; }

  get nombreCompleto(): string { return `${this._nombre} ${this._apellido}`; }
}
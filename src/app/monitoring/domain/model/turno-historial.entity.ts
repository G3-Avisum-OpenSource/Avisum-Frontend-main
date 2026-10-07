import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Turno implements BaseEntity {
  private _id: number;
  private _conductorId: number;
  private _busId: string;
  private _rutaNombre: string;
  private _rutaOrigen: string;
  private _rutaDestino: string;
  private _distanciaKm: number;
  private _tiempoSegundos: number;
  private _pasajeros: number;
  private _recaudacion: number;
  private _estado: 'ACTIVO' | 'FINALIZADO';
  private _fechaInicio: Date;
  private _fechaFin: Date | null;

  constructor(props: {
    id: number; conductorId: number; busId: string;
    rutaNombre: string; rutaOrigen: string; rutaDestino: string;
    distanciaKm: number; tiempoSegundos: number; pasajeros: number;
    recaudacion: number; estado: 'ACTIVO' | 'FINALIZADO';
    fechaInicio: Date; fechaFin: Date | null;
  }) {
    this._id = props.id;
    this._conductorId = props.conductorId;
    this._busId = props.busId;
    this._rutaNombre = props.rutaNombre;
    this._rutaOrigen = props.rutaOrigen;
    this._rutaDestino = props.rutaDestino;
    this._distanciaKm = props.distanciaKm;
    this._tiempoSegundos = props.tiempoSegundos;
    this._pasajeros = props.pasajeros;
    this._recaudacion = props.recaudacion;
    this._estado = props.estado;
    this._fechaInicio = props.fechaInicio;
    this._fechaFin = props.fechaFin;
  }

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }
  get conductorId(): number { return this._conductorId; }
  get busId(): string { return this._busId; }
  get rutaNombre(): string { return this._rutaNombre; }
  get rutaOrigen(): string { return this._rutaOrigen; }
  get rutaDestino(): string { return this._rutaDestino; }
  get distanciaKm(): number { return this._distanciaKm; }
  set distanciaKm(v: number) { this._distanciaKm = v; }
  get tiempoSegundos(): number { return this._tiempoSegundos; }
  set tiempoSegundos(v: number) { this._tiempoSegundos = v; }
  get pasajeros(): number { return this._pasajeros; }
  set pasajeros(v: number) { this._pasajeros = v; }
  get recaudacion(): number { return this._recaudacion; }
  set recaudacion(v: number) { this._recaudacion = v; }
  get estado(): 'ACTIVO' | 'FINALIZADO' { return this._estado; }
  set estado(v: 'ACTIVO' | 'FINALIZADO') { this._estado = v; }
  get fechaInicio(): Date { return this._fechaInicio; }
  get fechaFin(): Date | null { return this._fechaFin; }
  set fechaFin(v: Date | null) { this._fechaFin = v; }
}
import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Alerta implements BaseEntity {
  private _id: number;
  private _conductorId: number;
  private _turnoId: number;
  private _latitud: number;
  private _longitud: number;
  private _timestamp: Date;
  private _estadoCentral: string;
  private _audioRemoto: string;
  private _resuelta: boolean;

  constructor(props: {
    id: number; conductorId: number; turnoId: number;
    latitud: number; longitud: number; timestamp: Date;
    estadoCentral: string; audioRemoto: string; resuelta: boolean;
  }) {
    this._id = props.id;
    this._conductorId = props.conductorId;
    this._turnoId = props.turnoId;
    this._latitud = props.latitud;
    this._longitud = props.longitud;
    this._timestamp = props.timestamp;
    this._estadoCentral = props.estadoCentral;
    this._audioRemoto = props.audioRemoto;
    this._resuelta = props.resuelta;
  }

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }
  get conductorId(): number { return this._conductorId; }
  get turnoId(): number { return this._turnoId; }
  get latitud(): number { return this._latitud; }
  get longitud(): number { return this._longitud; }
  get timestamp(): Date { return this._timestamp; }
  get estadoCentral(): string { return this._estadoCentral; }
  get audioRemoto(): string { return this._audioRemoto; }
  get resuelta(): boolean { return this._resuelta; }
  set resuelta(v: boolean) { this._resuelta = v; }

  get coordenadasStr(): string {
    return `${this._latitud.toFixed(4)}° N, ${Math.abs(this._longitud).toFixed(4)}° W`;
  }
}

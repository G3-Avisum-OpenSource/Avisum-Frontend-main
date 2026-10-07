import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class Pasajero implements BaseEntity {
  private _id: number;
  private _turnoId: number;
  private _busId: string;
  private _totalAbordaron: number;
  private _totalBajaron: number;
  private _totalAbordo: number;
  private _timestamp: Date;
  private _anomalia: boolean;

  constructor(props: {
    id: number; turnoId: number; busId: string;
    totalAbordaron: number; totalBajaron: number;
    totalAbordo: number; timestamp: Date; anomalia: boolean;
  }) {
    this._id = props.id;
    this._turnoId = props.turnoId;
    this._busId = props.busId;
    this._totalAbordaron = props.totalAbordaron;
    this._totalBajaron = props.totalBajaron;
    this._totalAbordo = props.totalAbordo;
    this._timestamp = props.timestamp;
    this._anomalia = props.anomalia;
  }

  get id(): number { return this._id; }
  set id(v: number) { this._id = v; }
  get turnoId(): number { return this._turnoId; }
  get busId(): string { return this._busId; }
  get totalAbordaron(): number { return this._totalAbordaron; }
  set totalAbordaron(v: number) { this._totalAbordaron = v; }
  get totalBajaron(): number { return this._totalBajaron; }
  set totalBajaron(v: number) { this._totalBajaron = v; }
  get totalAbordo(): number { return this._totalAbordo; }
  set totalAbordo(v: number) { this._totalAbordo = v; }
  get timestamp(): Date { return this._timestamp; }
  get anomalia(): boolean { return this._anomalia; }
  set anomalia(v: boolean) { this._anomalia = v; }
}

import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export class UnidadBus implements BaseEntity {
  id!: number; placa!: string; conductor!: string; ruta!: string;
  estado!: 'ACTIVO' | 'INACTIVO' | 'ALERTA'; lat!: number; lng!: number;
  pasajeros!: number; velocidad!: number;
  constructor(p: { id:number; placa:string; conductor:string; ruta:string; estado:'ACTIVO'|'INACTIVO'|'ALERTA'; lat:number; lng:number; pasajeros:number; velocidad:number; }) {
    Object.assign(this, p);
  }
}
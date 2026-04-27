import { Module } from '@nestjs/common';
import { VietQRService } from './vietqr.service';

@Module({
  providers: [VietQRService],
  exports: [VietQRService],
})
export class VietQRModule {}

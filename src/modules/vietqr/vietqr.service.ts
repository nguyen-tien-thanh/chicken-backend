import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VietQRService {
  private readonly bankCode: string;
  private readonly accountNumber: string;
  private readonly accountName: string;

  constructor(private readonly config: ConfigService) {
    this.bankCode = this.config.get<string>('vietqr.bankCode', '');
    this.accountNumber = this.config.get<string>('vietqr.accountNumber', '');
    this.accountName = this.config.get<string>('vietqr.accountName', '');
  }

  /**
   * Tạo URL ảnh QR theo VietQR img API.
   * Docs: https://www.vietqr.io/danh-sach-api/generate-qr-code/
   */
  generateQRUrl(amount: number, description: string): string {
    const encodedName = encodeURIComponent(this.accountName);
    const encodedDesc = encodeURIComponent(description);
    return (
      `https://img.vietqr.io/image/${this.bankCode}-${this.accountNumber}-compact2.png` +
      `?amount=${Math.round(amount)}&addInfo=${encodedDesc}&accountName=${encodedName}`
    );
  }
}

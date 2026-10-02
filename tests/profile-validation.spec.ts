import { expect, test } from '@playwright/test';
import { validateProfile } from '../src/lib/profileSchema';

test.describe('Profile Validation Rules (Zod Schema)', () => {
  test('Bắt buộc họ và tên, không được để trống hoặc chỉ có khoảng trắng', () => {
    const res1 = validateProfile({ fullName: '' });
    expect(res1.isValid).toBe(false);
    expect(res1.errors.fullName).toBe('Vui lòng nhập họ và tên.');

    const res2 = validateProfile({ fullName: '   ' });
    expect(res2.isValid).toBe(false);
    expect(res2.errors.fullName).toBe('Vui lòng nhập họ và tên.');
  });

  test('Họ và tên phải có ít nhất 2 từ (gồm Họ và Tên)', () => {
    const res = validateProfile({ fullName: 'Nguyễn' });
    expect(res.isValid).toBe(false);
    expect(res.errors.fullName).toBe('Họ và tên cần bao gồm ít nhất 2 từ (gồm Họ và Tên).');
  });

  test('Họ và tên không được chứa số hoặc ký tự đặc biệt', () => {
    const res = validateProfile({ fullName: 'Nguyễn Văn 123' });
    expect(res.isValid).toBe(false);
    expect(res.errors.fullName).toBe(
      'Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa số hoặc ký tự đặc biệt.'
    );
  });

  test('Họ và tên chấp nhận tiếng Việt có dấu đầy đủ', () => {
    const res = validateProfile({ fullName: 'Nguyễn Trần Minh Đức' });
    expect(res.errors.fullName).toBeUndefined();
  });

  test('Số CCCD nếu có nhập phải gồm đúng 12 chữ số', () => {
    // 11 số
    const res1 = validateProfile({ fullName: 'Nguyễn Văn An', identityNumber: '01234567890' });
    expect(res1.isValid).toBe(false);
    expect(res1.errors.identityNumber).toBe('Số CCCD / Mã định danh cá nhân phải gồm đúng 12 chữ số.');

    // 13 số
    const res2 = validateProfile({ fullName: 'Nguyễn Văn An', identityNumber: '0123456789012' });
    expect(res2.isValid).toBe(false);
    expect(res2.errors.identityNumber).toBe('Số CCCD / Mã định danh cá nhân phải gồm đúng 12 chữ số.');

    // Chứa chữ cái
    const res3 = validateProfile({ fullName: 'Nguyễn Văn An', identityNumber: '01234567890A' });
    expect(res3.isValid).toBe(false);
    expect(res3.errors.identityNumber).toBe('Số CCCD / Mã định danh cá nhân phải gồm đúng 12 chữ số.');

    // Đúng 12 số
    const res4 = validateProfile({ fullName: 'Nguyễn Văn An', identityNumber: '001098012345' });
    expect(res4.errors.identityNumber).toBeUndefined();
  });

  test('Số điện thoại nếu có nhập phải theo định dạng di động Việt Nam (10 số, đầu 03, 05, 07, 08, 09)', () => {
    // Đầu số bàn / đầu số lạ
    const res1 = validateProfile({ fullName: 'Nguyễn Văn An', phoneNumber: '0243123456' });
    expect(res1.isValid).toBe(false);
    expect(res1.errors.phoneNumber).toBe(
      'Số điện thoại không hợp lệ (gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09).'
    );

    // 9 số
    const res2 = validateProfile({ fullName: 'Nguyễn Văn An', phoneNumber: '091234567' });
    expect(res2.isValid).toBe(false);

    // Chấp nhận số hợp lệ có khoảng trắng / dấu chấm
    const res3 = validateProfile({ fullName: 'Nguyễn Văn An', phoneNumber: '0912 345 678' });
    expect(res3.errors.phoneNumber).toBeUndefined();

    const res4 = validateProfile({ fullName: 'Nguyễn Văn An', phoneNumber: '0868123456' });
    expect(res4.errors.phoneNumber).toBeUndefined();
  });

  test('Ngày sinh không được ở tương lai và phải sau năm 1900', () => {
    // Ngày tương lai
    const res1 = validateProfile({ fullName: 'Nguyễn Văn An', dateOfBirth: '2099-01-01' });
    expect(res1.isValid).toBe(false);
    expect(res1.errors.dateOfBirth).toBe('Ngày sinh không được vượt quá ngày hiện tại.');

    // Trước năm 1900
    const res2 = validateProfile({ fullName: 'Nguyễn Văn An', dateOfBirth: '1899-12-31' });
    expect(res2.isValid).toBe(false);
    expect(res2.errors.dateOfBirth).toBe('Năm sinh không hợp lệ (từ năm 1900 trở lại đây).');

    // Ngày sinh hợp lệ
    const res3 = validateProfile({ fullName: 'Nguyễn Văn An', dateOfBirth: '1995-08-19' });
    expect(res3.errors.dateOfBirth).toBeUndefined();
  });

  test('Địa chỉ thường trú và tạm trú nếu nhập phải từ 5 đến 255 ký tự', () => {
    // Quá ngắn
    const res1 = validateProfile({ fullName: 'Nguyễn Văn An', permanentAddress: 'HN' });
    expect(res1.isValid).toBe(false);
    expect(res1.errors.permanentAddress).toBe(
      'Địa chỉ thường trú quá ngắn (vui lòng nhập rõ số nhà/đường, phường/xã, quận/huyện, tỉnh/thành phố).'
    );

    // Hợp lệ
    const res2 = validateProfile({
      fullName: 'Nguyễn Văn An',
      permanentAddress: 'Số 12 phố Huế, phường Hàng Bài, quận Hoàn Kiếm, Hà Nội',
      temporaryAddress: 'Số 45 ngõ 198 Thái Hà, Đống Đa, Hà Nội',
    });
    expect(res2.errors.permanentAddress).toBeUndefined();
    expect(res2.errors.temporaryAddress).toBeUndefined();
  });

  test('Form đầy đủ hợp lệ trả về isValid true', () => {
    const res = validateProfile({
      fullName: 'Nguyễn Văn An',
      identityNumber: '001095012345',
      phoneNumber: '0987654321',
      dateOfBirth: '1995-05-20',
      gender: 'Nam',
      permanentAddress: 'Số 10 đường Trần Phú, phường Mộ Lao, quận Hà Đông, Hà Nội',
      temporaryAddress: 'Số 25 đường Cầu Giấy, phường Quan Hoa, Cầu Giấy, Hà Nội',
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });
});

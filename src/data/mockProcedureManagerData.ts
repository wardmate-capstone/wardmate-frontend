import {
  ProcedureItem,
  ProcedureCategory,
  LegalDocument,
  AiKnowledgeSource,
  ProcedureAuditLog,
  ProcedureManagerStats,
  ProcedureForm
} from '@/types/procedureManager';

export const mockProcedureCategories: ProcedureCategory[] = [
  {
    id: 'cat-hotich',
    code: 'HO_TICH',
    name: 'Hộ tịch',
    description: 'Khai sinh, khai tử, kết hôn, giám hộ, nhận cha mẹ con và xác nhận tình trạng hôn nhân.',
    procedureCount: 14,
    iconName: 'Heart'
  },
  {
    id: 'cat-chungthuc',
    code: 'CHUNG_THUC',
    name: 'Chứng thực',
    description: 'Chứng thực bản sao từ bản chính, chứng thực chữ ký, chứng thực hợp đồng giao dịch.',
    procedureCount: 8,
    iconName: 'SealCheck'
  },
  {
    id: 'cat-datdai',
    code: 'DAT_DAI',
    name: 'Đất đai & Nhà ở',
    description: 'Đăng ký biến động, xác nhận hiện trạng sử dụng đất, cấp đổi cấp lại giấy chứng nhận.',
    procedureCount: 11,
    iconName: 'HouseLine'
  },
  {
    id: 'cat-xaydung',
    code: 'XAY_DUNG',
    name: 'Xây dựng & Đô thị',
    description: 'Cấp phép xây dựng nhà ở riêng lẻ, sửa chữa cải tạo, xác nhận quy hoạch xây dựng.',
    procedureCount: 9,
    iconName: 'Buildings'
  },
  {
    id: 'cat-laodong',
    code: 'LAO_DONG',
    name: 'Lao động - Thương binh & Xã hội',
    description: 'Trợ cấp xã hội, mai táng phí, xác nhận người có công, bảo trợ trẻ em.',
    procedureCount: 7,
    iconName: 'UsersThree'
  },
  {
    id: 'cat-kinhdoanh',
    code: 'KINH_DOANH',
    name: 'Hộ kinh doanh',
    description: 'Đăng ký thành lập hộ kinh doanh cá thể, thay đổi nội dung, tạm ngừng hoạt động.',
    procedureCount: 5,
    iconName: 'Storefront'
  }
];

export const mockLegalDocuments: LegalDocument[] = [
  {
    id: 'leg-01',
    docNumber: '60/2014/QH13',
    title: 'Luật Hộ tịch năm 2014',
    docType: 'LUAT',
    issuingAuthority: 'Quốc hội',
    issuedDate: '20/11/2014',
    effectiveDate: '01/01/2016',
    status: 'VALID',
    fileUrl: '/docs/luat-ho-tich-2014.pdf',
    sourceUrl: 'https://thuvienphapluat.vn',
    notes: 'Quy định về quyền và nghĩa vụ đăng ký hộ tịch của cá nhân.',
    linkedProcedureCount: 12
  },
  {
    id: 'leg-02',
    docNumber: '123/2015/NĐ-CP',
    title: 'Nghị định 123/2015/NĐ-CP hướng dẫn thi hành Luật Hộ tịch',
    docType: 'NGHI_DINH',
    issuingAuthority: 'Chính phủ',
    issuedDate: '15/11/2015',
    effectiveDate: '01/01/2016',
    status: 'VALID',
    fileUrl: '/docs/nd-123-2015.pdf',
    sourceUrl: 'https://thuvienphapluat.vn',
    notes: 'Quy định chi tiết về đăng ký khai sinh, kết hôn, cấp giấy xác nhận.',
    linkedProcedureCount: 8
  },
  {
    id: 'leg-03',
    docNumber: '04/2020/TT-BTP',
    title: 'Thông tư 04/2020/TT-BTP quy định chi tiết một số điều của Luật Hộ tịch',
    docType: 'THONG_TU',
    issuingAuthority: 'Bộ Tư pháp',
    issuedDate: '28/05/2020',
    effectiveDate: '16/07/2020',
    status: 'VALID',
    fileUrl: '/docs/tt-04-2020-btp.pdf',
    sourceUrl: 'https://thuvienphapluat.vn',
    notes: 'Cập nhật mẫu giấy tờ hộ tịch và quy trình số hóa sổ hộ tịch.',
    linkedProcedureCount: 10
  },
  {
    id: 'leg-04',
    docNumber: '23/2015/NĐ-CP',
    title: 'Nghị định 23/2015/NĐ-CP về cấp bản sao từ sổ gốc, chứng thực bản sao, chứng thực chữ ký',
    docType: 'NGHI_DINH',
    issuingAuthority: 'Chính phủ',
    issuedDate: '16/02/2015',
    effectiveDate: '10/04/2015',
    status: 'VALID',
    fileUrl: '/docs/nd-23-2015.pdf',
    sourceUrl: 'https://thuvienphapluat.vn',
    notes: 'Căn cứ áp dụng cho các thủ tục chứng thực cấp xã phường.',
    linkedProcedureCount: 6
  },
  {
    id: 'leg-05',
    docNumber: '01/2020/TT-BTP',
    title: 'Thông tư 01/2020/TT-BTP hướng dẫn Nghị định 23/2015/NĐ-CP về chứng thực',
    docType: 'THONG_TU',
    issuingAuthority: 'Bộ Tư pháp',
    issuedDate: '03/03/2020',
    effectiveDate: '20/04/2020',
    status: 'VALID',
    fileUrl: '/docs/tt-01-2020-btp.pdf',
    sourceUrl: 'https://thuvienphapluat.vn',
    notes: 'Hướng dẫn cụ thể về trách nhiệm người yêu cầu chứng thực.',
    linkedProcedureCount: 5
  },
  {
    id: 'leg-06',
    docNumber: '104/2022/NĐ-CP',
    title: 'Nghị định 104/2022/NĐ-CP sửa đổi, bổ sung quy định liên quan đến việc nộp, xuất trình sổ hộ khẩu',
    docType: 'NGHI_DINH',
    issuingAuthority: 'Chính phủ',
    issuedDate: '22/12/2022',
    effectiveDate: '01/01/2023',
    status: 'VALID',
    fileUrl: '/docs/nd-104-2022.pdf',
    sourceUrl: 'https://thuvienphapluat.vn',
    notes: 'Khắc phục việc yêu cầu xuất trình sổ hộ khẩu giấy khi giải quyết thủ tục.',
    linkedProcedureCount: 14
  }
];

export const mockForms: ProcedureForm[] = [
  {
    id: 'form-01',
    code: 'BM-HT-01',
    name: 'Tờ khai đăng ký kết hôn',
    procedureId: 'proc-01',
    procedureName: 'Đăng ký kết hôn',
    currentVersion: 'V3',
    fileType: 'BOTH',
    effectiveDate: '01/01/2026',
    expirationDate: '',
    status: 'PUBLISHED',
    updatedAt: '21/09/2026',
    description: 'Mẫu chuẩn ban hành kèm theo Thông tư 04/2020/TT-BTP của Bộ Tư pháp.',
    wordFileName: 'To_khai_dang_ky_ket_hon_V3.docx',
    pdfFileName: 'To_khai_dang_ky_ket_hon_V3.pdf',
    sampleFilledFileName: 'Mau_dien_san_To_khai_ket_hon.pdf',
    fileSize: '145 KB',
    versions: [
      {
        version: 'V1',
        status: 'ARCHIVED',
        effectiveDate: '01/01/2020',
        expirationDate: '31/12/2022',
        createdBy: 'Trần Văn Cường (Chuyên viên Pháp chế)',
        createdAt: '15/12/2019',
        changeLog: 'Ban hành phiên bản mẫu giấy tờ theo Thông tư 04/2020/TT-BTP.',
        wordFileName: 'To_khai_ket_hon_V1.docx',
        pdfFileName: 'To_khai_ket_hon_V1.pdf',
        fileSize: '120 KB'
      },
      {
        version: 'V2',
        status: 'ARCHIVED',
        effectiveDate: '01/01/2023',
        expirationDate: '31/12/2025',
        createdBy: 'Nguyễn Thị Hải Yến (Chuyên viên Hộ tịch)',
        createdAt: '25/12/2022',
        changeLog: 'Cắt giảm mục xuất trình Sổ hộ khẩu theo Nghị định 104/2022/NĐ-CP.',
        wordFileName: 'To_khai_ket_hon_V2.docx',
        pdfFileName: 'To_khai_ket_hon_V2.pdf',
        fileSize: '132 KB'
      },
      {
        version: 'V3',
        status: 'PUBLISHED',
        effectiveDate: '01/01/2026',
        createdBy: 'Lê Hoàng Nam (Trưởng bộ phận Quản lý Thủ tục)',
        createdAt: '18/12/2025',
        changeLog: 'Chuẩn hóa định dạng văn bản Word chuẩn A4 hỗ trợ công dân biên tập trực tiếp.',
        wordFileName: 'To_khai_dang_ky_ket_hon_V3.docx',
        pdfFileName: 'To_khai_dang_ky_ket_hon_V3.pdf',
        sampleFilledFileName: 'Mau_dien_san_To_khai_ket_hon.pdf',
        fileSize: '145 KB'
      }
    ]
  },
  {
    id: 'form-02',
    code: 'BM-HT-02',
    name: 'Tờ khai đăng ký khai sinh',
    procedureId: 'proc-02',
    procedureName: 'Đăng ký khai sinh (Thường trú)',
    currentVersion: 'V2',
    fileType: 'BOTH',
    effectiveDate: '01/01/2025',
    status: 'PUBLISHED',
    updatedAt: '18/09/2026',
    description: 'Tờ khai áp dụng cho cha, mẹ đăng ký khai sinh đúng hạn hoặc quá hạn cho con.',
    wordFileName: 'To_khai_dang_ky_khai_sinh_V2.docx',
    pdfFileName: 'To_khai_dang_ky_khai_sinh_V2.pdf',
    sampleFilledFileName: 'Mau_dien_khai_sinh_minh_hoa.pdf',
    fileSize: '128 KB',
    versions: [
      {
        version: 'V1',
        status: 'ARCHIVED',
        effectiveDate: '01/01/2020',
        expirationDate: '31/12/2024',
        createdBy: 'Trần Văn Cường',
        createdAt: '10/12/2019',
        changeLog: 'Phiên bản ban đầu theo Thông tư 04/2020/TT-BTP.',
        wordFileName: 'To_khai_khai_sinh_V1.docx',
        fileSize: '115 KB'
      },
      {
        version: 'V2',
        status: 'PUBLISHED',
        effectiveDate: '01/01/2025',
        createdBy: 'Lê Hoàng Nam',
        createdAt: '20/12/2024',
        changeLog: 'Bổ sung thông tin số định danh cá nhân và cấp thẻ BHYT liên thông.',
        wordFileName: 'To_khai_dang_ky_khai_sinh_V2.docx',
        pdfFileName: 'To_khai_dang_ky_khai_sinh_V2.pdf',
        fileSize: '128 KB'
      }
    ]
  },
  {
    id: 'form-03',
    code: 'BM-HN-01',
    name: 'Tờ khai cấp Giấy xác nhận tình trạng hôn nhân',
    procedureId: 'proc-05',
    procedureName: 'Cấp Giấy xác nhận tình trạng hôn nhân',
    currentVersion: 'V2',
    fileType: 'BOTH',
    effectiveDate: '01/01/2024',
    status: 'PUBLISHED',
    updatedAt: '10/09/2026',
    description: 'Mẫu chuẩn phục vụ mục đích kết hôn hoặc giao dịch bất động sản, vay vốn ngân hàng.',
    wordFileName: 'To_khai_xac_nhan_tinh_trang_hon_nhan_V2.docx',
    pdfFileName: 'To_khai_xac_nhan_tinh_trang_hon_nhan_V2.pdf',
    fileSize: '118 KB',
    versions: [
      {
        version: 'V1',
        status: 'ARCHIVED',
        effectiveDate: '01/01/2020',
        expirationDate: '31/12/2023',
        createdBy: 'Nguyễn Thị Hải Yến',
        createdAt: '15/12/2019',
        changeLog: 'Phiên bản theo mẫu Thông tư 04.',
        wordFileName: 'To_khai_hon_nhan_V1.docx',
        fileSize: '105 KB'
      },
      {
        version: 'V2',
        status: 'PUBLISHED',
        effectiveDate: '01/01/2024',
        createdBy: 'Lê Hoàng Nam',
        createdAt: '22/12/2023',
        changeLog: 'Chuẩn hóa định dạng Word công dân biên tập trực tiếp.',
        wordFileName: 'To_khai_xac_nhan_tinh_trang_hon_nhan_V2.docx',
        pdfFileName: 'To_khai_xac_nhan_tinh_trang_hon_nhan_V2.pdf',
        fileSize: '118 KB'
      }
    ]
  },
  {
    id: 'form-04',
    code: 'BM-XD-01',
    name: 'Đơn đề nghị cấp Giấy phép xây dựng nhà ở riêng lẻ',
    procedureId: 'proc-04',
    procedureName: 'Cấp giấy phép xây dựng nhà ở riêng lẻ',
    currentVersion: 'V1',
    fileType: 'WORD',
    effectiveDate: '01/01/2026',
    status: 'DRAFT',
    updatedAt: '12/09/2026',
    description: 'Mẫu đơn đề nghị cấp phép xây dựng công trình nhà ở đô thị riêng lẻ.',
    wordFileName: 'Don_de_nghi_cap_giay_phep_xay_dung_V1.docx',
    fileSize: '210 KB',
    versions: [
      {
        version: 'V1',
        status: 'DRAFT',
        effectiveDate: '01/01/2026',
        createdBy: 'Lê Hoàng Nam',
        createdAt: '12/09/2026',
        changeLog: 'Bản thảo biểu mẫu mới theo hướng dẫn xây dựng đô thị.',
        wordFileName: 'Don_de_nghi_cap_giay_phep_xay_dung_V1.docx',
        fileSize: '210 KB'
      }
    ]
  }
];

export const mockProcedures: ProcedureItem[] = [
  {
    id: 'proc-01',
    code: 'HT-01',
    title: 'Đăng ký kết hôn',
    categoryId: 'cat-hotich',
    categoryName: 'Hộ tịch',
    version: 'V3',
    status: 'PUBLISHED',
    updatedAt: '21/09/2026',
    updatedBy: 'Lê Hoàng Nam',
    description: 'Thủ tục đăng ký kết hôn cho công dân Việt Nam cư trú trong nước, giải quyết tại UBND xã/phường nơi cư trú của một trong hai bên nam, nữ.',
    targetAudience: 'Nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên; việc kết hôn do nam và nữ tự nguyện quyết định; không bị mất năng lực hành vi dân sự.',
    receivingAuthority: 'Ủy ban nhân dân Cấp Xã / Phường / Thị trấn',
    receivingLocation: 'Bộ phận Tiếp nhận và Trả kết quả (Một cửa) UBND Phường An Khánh',
    resultDescription: 'Giấy chứng nhận kết hôn (bản chính cấp cho mỗi bên 01 bản) và trích lục kết hôn (nếu có yêu cầu).',
    processingTimeDays: 0,
    timeUnit: 'GIO',
    feeAmount: 0,
    isFeeFree: true,
    feeNotes: 'Miễn lệ phí đăng ký kết hôn đối với công dân Việt Nam cư trú ở trong nước.',
    workingHoursNotes: 'Buổi sáng: 07:30 - 11:30, Buổi chiều: 13:00 - 17:00 (Từ Thứ 2 đến Thứ 6 và Sáng Thứ 7).',
    hasForms: true,
    isChecklistComplete: true,
    conditions: [
      {
        id: 'cond-01',
        order: 1,
        content: 'Nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên.',
        isMandatory: true,
        notes: 'Căn cứ ngày tháng năm sinh trên Thẻ Căn cước.'
      },
      {
        id: 'cond-02',
        order: 2,
        content: 'Việc kết hôn do nam và nữ tự nguyện quyết định, hai bên phải có mặt tại thời điểm trao nhận Giấy chứng nhận kết hôn.',
        isMandatory: true
      },
      {
        id: 'cond-03',
        order: 3,
        content: 'Không bị mất năng lực hành vi dân sự.',
        isMandatory: true
      },
      {
        id: 'cond-04',
        order: 4,
        content: 'Không thuộc các trường hợp cấm kết hôn theo quy định tại điểm a, b, c và d khoản 2 Điều 5 của Luật Hôn nhân và gia đình.',
        isMandatory: true
      },
      {
        id: 'cond-05',
        order: 5,
        content: 'Một trong hai bên phải có nơi đăng ký thường trú hoặc tạm trú tại địa bàn phường An Khánh.',
        isMandatory: true,
        notes: 'Xác thực tự động qua Cơ sở dữ liệu Quốc gia về Dân cư.'
      }
    ],
    checklistTemplates: [
      {
        id: 'chk-01',
        order: 1,
        documentName: 'Thẻ Căn cước / CCCD của cả hai bên nam, nữ',
        description: 'Bản chính còn hạn sử dụng hoặc căn cước điện tử mức độ 2 trên VNeID.',
        isMandatory: true,
        allowUpload: true,
        maxFiles: 2,
        allowedFormats: ['jpg', 'png', 'pdf'],
        instruction: 'Chụp rõ 2 mặt thẻ Căn cước, không lóa sáng, không bị che khuất con chip hoặc góc ảnh.'
      },
      {
        id: 'chk-02',
        order: 2,
        documentName: 'Tờ khai đăng ký kết hôn (Mẫu Word / PDF)',
        description: 'Điền thông tin trực tiếp trên file Word hoặc tải về điền rồi xuất PDF nộp.',
        isMandatory: true,
        allowUpload: true,
        maxFiles: 1,
        allowedFormats: ['pdf', 'docx'],
        instruction: 'Công dân mở chỉnh sửa trực tiếp trên WardMate hoặc tải file Word về máy biên tập.'
      },
      {
        id: 'chk-03',
        order: 3,
        documentName: 'Giấy xác nhận tình trạng hôn nhân',
        description: 'Áp dụng nếu bên nam hoặc bên nữ cư trú tại địa phương khác với UBND giải quyết đăng ký.',
        isMandatory: false,
        allowUpload: true,
        maxFiles: 2,
        allowedFormats: ['pdf', 'jpg', 'png'],
        instruction: 'Thời hạn Giấy xác nhận tình trạng hôn nhân không quá 06 tháng kể từ ngày cấp.'
      }
    ],
    steps: [
      {
        id: 'step-01',
        stepNumber: 1,
        title: 'Tra cứu thủ tục & Chỉnh sửa Biểu mẫu Word',
        description: 'Công dân tải file Word hoặc mở trực tiếp trên WardMate để chỉnh sửa, lưu nháp và xuất PDF.',
        responsibleParty: 'CITIZEN',
        estimatedDuration: '15 phút'
      },
      {
        id: 'step-02',
        stepNumber: 2,
        title: 'Gửi hồ sơ tiền kiểm trực tuyến',
        description: 'Đính kèm bản PDF đã xuất và ảnh chụp CCCD gửi cán bộ Một cửa tiền kiểm.',
        responsibleParty: 'SYSTEM',
        estimatedDuration: 'Tức thì'
      },
      {
        id: 'step-03',
        stepNumber: 3,
        title: 'Cán bộ Một cửa tiền kiểm hồ sơ',
        description: 'Cán bộ kiểm tra điều kiện, checklist thành phần, tệp đính kèm và bản PDF tờ khai.',
        responsibleParty: 'OFFICER',
        estimatedDuration: '2 - 4 giờ làm việc'
      },
      {
        id: 'step-04',
        stepNumber: 4,
        title: 'Hai bên có mặt tại UBND đối chiếu và ký sổ',
        description: 'Hai bên nam, nữ có mặt tại Bộ phận Một cửa, xuất trình CCCD bản chính và ký sổ kết hôn.',
        responsibleParty: 'UBND',
        estimatedDuration: '15 phút'
      }
    ],
    forms: [mockForms[0]],
    legalDocuments: [mockLegalDocuments[0], mockLegalDocuments[1], mockLegalDocuments[2], mockLegalDocuments[5]]
  },
  {
    id: 'proc-02',
    code: 'HT-02',
    title: 'Đăng ký khai sinh (Thường trú)',
    categoryId: 'cat-hotich',
    categoryName: 'Hộ tịch',
    version: 'V2',
    status: 'PUBLISHED',
    updatedAt: '18/09/2026',
    updatedBy: 'Trần Văn Cường',
    description: 'Thủ tục đăng ký khai sinh cho trẻ em sinh ra trong nước có cha, mẹ là công dân Việt Nam.',
    targetAudience: 'Người có trách nhiệm đăng ký khai sinh cho trẻ (cha, mẹ, ông bà hoặc người thân thích).',
    receivingAuthority: 'UBND Cấp Xã / Phường',
    receivingLocation: 'Bộ phận Một cửa UBND Phường An Khánh',
    resultDescription: 'Giấy khai sinh bản chính và Bản sao trích lục khai sinh (nếu có yêu cầu).',
    processingTimeDays: 0,
    timeUnit: 'GIO',
    feeAmount: 0,
    isFeeFree: true,
    feeNotes: 'Miễn lệ phí đăng ký khai sinh đúng hạn.',
    workingHoursNotes: 'Giờ hành chính các ngày làm việc trong tuần.',
    hasForms: true,
    isChecklistComplete: true,
    conditions: [
      {
        id: 'c-ks-1',
        order: 1,
        content: 'Trẻ em sinh ra tại Việt Nam có cha hoặc mẹ đăng ký thường trú/tạm trú tại địa phương.',
        isMandatory: true
      }
    ],
    checklistTemplates: [
      {
        id: 'chk-ks-1',
        order: 1,
        documentName: 'Giấy chứng sinh do cơ sở y tế cấp',
        description: 'Bản chính Giấy chứng sinh do Bệnh viện / Trung tâm y tế nơi trẻ sinh ra cấp.',
        isMandatory: true,
        allowUpload: true,
        maxFiles: 1,
        allowedFormats: ['pdf', 'jpg', 'png'],
        instruction: 'Chụp rõ nét đầy đủ 4 góc, có dấu mộc tròn đỏ của bệnh viện.'
      },
      {
        id: 'chk-ks-2',
        order: 2,
        documentName: 'Tờ khai đăng ký khai sinh (Mẫu Word / PDF)',
        description: 'Tờ khai điền đầy đủ thông tin cha, mẹ, con.',
        isMandatory: true,
        allowUpload: true,
        maxFiles: 1,
        allowedFormats: ['pdf', 'docx'],
        instruction: 'Chỉnh sửa trực tiếp file Word trên WardMate hoặc tải về điền rồi xuất PDF.'
      }
    ],
    steps: [
      {
        id: 's-ks-1',
        stepNumber: 1,
        title: 'Chỉnh sửa Tờ khai Word và xuất PDF',
        description: 'Công dân điền thông tin trẻ, cha, mẹ trên biểu mẫu Word và xuất PDF nộp tiền kiểm.',
        responsibleParty: 'CITIZEN'
      },
      {
        id: 's-ks-2',
        stepNumber: 2,
        title: 'Cán bộ kiểm tra & cấp số định danh cá nhân',
        description: 'Cán bộ Một cửa tiền kiểm và chuyển dữ liệu cấp mã số định danh.',
        responsibleParty: 'OFFICER'
      }
    ],
    forms: [mockForms[1]],
    legalDocuments: [mockLegalDocuments[0], mockLegalDocuments[1]]
  },
  {
    id: 'proc-03',
    code: 'CT-01',
    title: 'Chứng thực bản sao từ bản chính',
    categoryId: 'cat-chungthuc',
    categoryName: 'Chứng thực',
    version: 'V2',
    status: 'PUBLISHED',
    updatedAt: '15/09/2026',
    updatedBy: 'Lê Hoàng Nam',
    description: 'Thủ tục chứng thực tính chính xác của bản sao so với bản chính các loại văn bản, giấy tờ do cơ quan có thẩm quyền cấp.',
    targetAudience: 'Cá nhân, tổ chức có yêu cầu chứng thực bản sao.',
    receivingAuthority: 'UBND Cấp Xã / Phường',
    receivingLocation: 'Bộ phận Tiếp nhận và Trả kết quả UBND Phường An Khánh',
    resultDescription: 'Bản sao văn bản có đóng dấu chứng thực đúng với bản chính.',
    processingTimeDays: 0,
    timeUnit: 'GIO',
    feeAmount: 2000,
    isFeeFree: false,
    feeNotes: '2.000 VNĐ / trang.',
    workingHoursNotes: 'Giải quyết ngay trong ngày làm việc.',
    hasForms: false,
    isChecklistComplete: true,
    conditions: [],
    checklistTemplates: [
      {
        id: 'chk-ct-1',
        order: 1,
        documentName: 'Bản chính văn bản, giấy tờ cần chứng thực',
        description: 'Văn bản gốc do cơ quan, tổ chức có thẩm quyền cấp.',
        isMandatory: true,
        allowUpload: true,
        maxFiles: 5,
        allowedFormats: ['pdf', 'jpg', 'png'],
        instruction: 'Tải ảnh chụp trang đầu và trang có chữ ký, con dấu của văn bản gốc.'
      }
    ],
    steps: [],
    forms: [],
    legalDocuments: [mockLegalDocuments[3], mockLegalDocuments[4]]
  },
  {
    id: 'proc-04',
    code: 'XD-01',
    title: 'Cấp giấy phép xây dựng nhà ở riêng lẻ',
    categoryId: 'cat-xaydung',
    categoryName: 'Xây dựng & Đô thị',
    version: 'V1',
    status: 'DRAFT',
    updatedAt: '12/09/2026',
    updatedBy: 'Lê Hoàng Nam',
    description: 'Thủ tục cấp giấy phép xây dựng mới đối với công trình nhà ở riêng lẻ tại đô thị.',
    targetAudience: 'Chủ sở hữu công trình nhà ở có quyền sử dụng đất hợp pháp.',
    receivingAuthority: 'UBND Cấp Quận / Huyện',
    receivingLocation: 'Bộ phận Tiếp nhận và Trả kết quả UBND Phường An Khánh',
    resultDescription: 'Giấy phép xây dựng kèm bản vẽ thiết kế được phê duyệt.',
    processingTimeDays: 15,
    timeUnit: 'NGAY_LAM_VIEC',
    feeAmount: 75000,
    isFeeFree: false,
    feeNotes: '75.000 VNĐ / giấy phép.',
    hasForms: true,
    isChecklistComplete: false,
    conditions: [],
    checklistTemplates: [],
    steps: [],
    forms: [mockForms[3]],
    legalDocuments: []
  },
  {
    id: 'proc-05',
    code: 'HT-03',
    title: 'Cấp Giấy xác nhận tình trạng hôn nhân',
    categoryId: 'cat-hotich',
    categoryName: 'Hộ tịch',
    version: 'V2',
    status: 'PUBLISHED',
    updatedAt: '10/09/2026',
    updatedBy: 'Trần Văn Cường',
    description: 'Thủ tục cấp Giấy xác nhận tình trạng hôn nhân để sử dụng vào mục đích kết hôn hoặc mục đích khác.',
    targetAudience: 'Công dân Việt Nam từ đủ tuổi kết hôn trở lên cư trú tại địa phương.',
    receivingAuthority: 'UBND Cấp Xã / Phường',
    receivingLocation: 'Bộ phận Một cửa UBND Phường An Khánh',
    resultDescription: 'Giấy xác nhận tình trạng hôn nhân (thời hạn 06 tháng).',
    processingTimeDays: 1,
    timeUnit: 'NGAY_LAM_VIEC',
    feeAmount: 15000,
    isFeeFree: false,
    feeNotes: '15.000 VNĐ / trường hợp.',
    hasForms: true,
    isChecklistComplete: true,
    conditions: [],
    checklistTemplates: [],
    steps: [],
    forms: [mockForms[2]],
    legalDocuments: [mockLegalDocuments[0], mockLegalDocuments[1], mockLegalDocuments[2]]
  }
];

export const mockAiKnowledgeSources: AiKnowledgeSource[] = [
  {
    id: 'ai-src-01',
    name: 'Cơ sở dữ liệu Văn bản quy phạm pháp luật',
    type: 'LEGAL_DOC',
    status: 'ACTIVE',
    syncStatus: 'SYNCED',
    lastUpdated: '21/09/2026 09:15',
    itemCount: 18,
    description: 'Toàn văn các Luật Hộ tịch, Luật Đất đai, Nghị định 123/2015/NĐ-CP, Nghị định 23/2015/NĐ-CP và các văn bản hướng dẫn nghiệp vụ.'
  },
  {
    id: 'ai-src-02',
    name: 'Kho câu hỏi thường gặp (FAQ Công dân & Cán bộ)',
    type: 'FAQ',
    status: 'ACTIVE',
    syncStatus: 'SYNCED',
    lastUpdated: '20/09/2026 16:40',
    itemCount: 65,
    description: 'Bộ câu hỏi giải đáp vướng mắc thường gặp trong tiền kiểm hồ sơ, chuẩn bị giấy tờ, căn cước và xác nhận cư trú.'
  },
  {
    id: 'ai-src-03',
    name: 'Sổ tay hướng dẫn nghiệp vụ thủ tục hành chính',
    type: 'PROCEDURE_GUIDE',
    status: 'ACTIVE',
    syncStatus: 'SYNCED',
    lastUpdated: '19/09/2026 11:20',
    itemCount: 45,
    description: 'Quy trình chi tiết, thẩm quyền giải quyết, lưu ý khi đối chiếu hồ sơ giấy và quy tắc đánh giá từng thành phần giấy tờ.'
  },
  {
    id: 'ai-src-04',
    name: 'Kho biểu mẫu chuẩn Word/PDF & Mẫu điền',
    type: 'OPERATIONAL_CONTENT',
    status: 'ACTIVE',
    syncStatus: 'SYNCED',
    lastUpdated: '21/09/2026 11:00',
    itemCount: 12,
    description: 'Các mẫu tờ khai chuẩn hóa dạng Word .docx và PDF phục vụ công dân biên tập trực tiếp.'
  }
];

export const mockProcedureAuditLogs: ProcedureAuditLog[] = [
  {
    id: 'log-01',
    timestamp: '21/09/2026 10:20',
    performedBy: 'Lê Hoàng Nam',
    performerRole: 'Trưởng bộ phận Quản lý Thủ tục',
    targetId: 'HT-01',
    targetName: 'Đăng ký kết hôn',
    targetType: 'PROCEDURE',
    action: 'UPDATE',
    summary: 'Cập nhật ghi chú thời gian làm việc và đồng bộ điều kiện cư trú.',
    details: 'Đã cập nhật mục giờ tiếp nhận: Sáng 07:30 - 11:30, Chiều 13:00 - 17:00.'
  },
  {
    id: 'log-02',
    timestamp: '21/09/2026 09:15',
    performedBy: 'Hệ thống WardMate AI',
    performerRole: 'Hệ thống tự động',
    targetId: 'ai-src-01',
    targetName: 'Cơ sở dữ liệu Văn bản quy phạm pháp luật',
    targetType: 'LEGAL_DOC',
    action: 'UPDATE',
    summary: 'Tự động đồng bộ vector embeddings cho 18 văn bản pháp lý.',
    details: 'Hoàn thành indexing 385 chunk tri thức vào bộ nhớ RAG.'
  },
  {
    id: 'log-03',
    timestamp: '20/09/2026 15:35',
    performedBy: 'Trần Văn Cường',
    performerRole: 'Chuyên viên Quản lý thủ tục',
    targetId: 'BM-HT-01',
    targetName: 'Tờ khai đăng ký kết hôn',
    targetType: 'FORM',
    action: 'VERSION_CHANGE',
    summary: 'Tạo và kích hoạt phiên bản biểu mẫu V3 dạng Word (.docx).',
    details: 'Chuyển trạng thái phiên bản V2 sang ARCHIVED, đặt V3 làm phiên bản hiện hành.'
  }
];

export const mockProcedureStats: ProcedureManagerStats = {
  publishedCount: 45,
  draftCount: 6,
  pausedCount: 3,
  activeFormsCount: 12,
  formsNeedUpdateCount: 4,
  legalDocsCount: 18
};

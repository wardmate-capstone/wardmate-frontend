import { popularProcedures } from './landing';

// Dữ liệu mẫu Cases và Checklist theo chuẩn nghiệp vụ thực tế Dịch vụ công & WardMate
const getProcedureDetailsMock = (title: string) => {
  if (title === 'Đăng ký khai sinh') {

    return {
      cases: [
        {
          caseCode: 'KHAI_SINH_DUNG_HAN',
          caseName: 'Đăng ký khai sinh đúng hạn (trong vòng 60 ngày)',
          description: 'Áp dụng cho trẻ em sinh ra tại Việt Nam, cha mẹ hoặc người có trách nhiệm đăng ký trong thời hạn 60 ngày kể từ ngày sinh.',
          steps: [
            { stepOrder: 1, stepName: 'Chuẩn bị và nộp hồ sơ', executor: 'Người nộp hồ sơ', actionDetails: 'Người yêu cầu nộp hồ sơ trực tuyến qua Cổng dịch vụ công hoặc nộp trực tiếp tại Bộ phận Một cửa UBND cấp xã.' },
            { stepOrder: 2, stepName: 'Tiếp nhận và kiểm tra hồ sơ', executor: 'Công chức Tư pháp - Hộ tịch', actionDetails: 'Kiểm tra tính hợp lệ và đầy đủ của hồ sơ; đối chiếu dữ liệu với Cơ sở dữ liệu quốc gia về dân cư.' },
            { stepOrder: 3, stepName: 'Ghi sổ hộ tịch và cấp Giấy khai sinh', executor: 'Chủ tịch UBND / Công chức Tư pháp', actionDetails: 'Lấy Số định danh cá nhân cho trẻ từ hệ thống, in Giấy khai sinh bản chính và trích lục, trình ký và trả kết quả.' }
          ]
        },
        {
          caseCode: 'KHAI_SINH_QUA_HAN',
          caseName: 'Đăng ký khai sinh quá hạn (sau 60 ngày)',
          description: 'Áp dụng cho trường hợp trẻ em sinh ra đã quá 60 ngày mà chưa đăng ký khai sinh.',
          steps: [
            { stepOrder: 1, stepName: 'Nộp hồ sơ và giải trình lý do', executor: 'Người nộp hồ sơ', actionDetails: 'Nộp đầy đủ giấy tờ kèm văn bản giải trình lý do quá hạn đăng ký khai sinh.' },
            { stepOrder: 2, stepName: 'Xác minh thông tin thực tế', executor: 'Công chức Tư pháp phối hợp Công an', actionDetails: 'Tiến hành xác minh nơi cư trú và sự kiện sinh của trẻ để đảm bảo tính xác thực.' },
            { stepOrder: 3, stepName: 'Phê duyệt và cấp Giấy khai sinh', executor: 'UBND cấp xã', actionDetails: 'Cấp Giấy khai sinh bản chính và cấp số định danh cá nhân sau khi hoàn tất xác minh.' }
          ]
        },
        {
          caseCode: 'KHAI_SINH_CHUA_KET_HON',
          caseName: 'Khai sinh kết hợp nhận cha mẹ con (cha mẹ chưa đăng ký kết hôn)',
          description: 'Áp dụng khi cha mẹ chưa đăng ký kết hôn hoặc cha muốn đồng thời làm thủ tục nhận con khi đăng ký khai sinh.',
          steps: [
            { stepOrder: 1, stepName: 'Nộp hồ sơ khai sinh & nhận cha con', executor: 'Người nộp hồ sơ', actionDetails: 'Nộp tờ khai khai sinh và tờ khai nhận cha, mẹ, con kèm chứng cứ chứng minh quan hệ cha con.' },
            { stepOrder: 2, stepName: 'Thẩm tra chứng cứ chứng minh cha con', executor: 'Công chức Tư pháp - Hộ tịch', actionDetails: 'Xem xét kết quả ADN hoặc văn bản cam đoan cha con có người làm chứng.' },
            { stepOrder: 3, stepName: 'Cấp Trích lục nhận cha mẹ con và Giấy khai sinh', executor: 'Chủ tịch UBND cấp xã', actionDetails: 'Ký Trích lục đăng ký nhận cha mẹ con và cấp Giấy khai sinh ghi đủ tên cha, mẹ.' }
          ]
        }
      ],
      checklist: [
        { checklistId: 'ks-1', caseCode: 'KHAI_SINH_DUNG_HAN', submissionType: 'NOP', itemName: 'Tờ khai đăng ký khai sinh (theo mẫu)', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Điền đầy đủ thông tin cha mẹ và người yêu cầu, có thể điền E-Form trực tuyến.', templateUrl: 'https://dichvucong.gov.vn/p/home/dvc-mau-don-khai-sinh.docx', templateFormat: 'DOCX' },
        { checklistId: 'ks-2', caseCode: 'KHAI_SINH_DUNG_HAN', submissionType: 'NOP', itemName: 'Giấy chứng sinh do cơ sở y tế cấp', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Nếu không có giấy chứng sinh thì nộp văn bản của người làm chứng xác nhận việc sinh hoặc giấy cam đoan.' },
        { checklistId: 'ks-3', caseCode: 'KHAI_SINH_DUNG_HAN', submissionType: 'XUAT_TRINH', itemName: 'Căn cước công dân / Hộ chiếu của người đi khai sinh', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Xuất trình để đối chiếu nhân thân, có thể dùng VNeID Mức 2 thay thế bản cứng.' },
        { checklistId: 'ks-4', caseCode: 'KHAI_SINH_DUNG_HAN', submissionType: 'XUAT_TRINH', itemName: 'Giấy chứng nhận kết hôn của cha mẹ', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: false, conditionNote: 'Không bắt buộc xuất trình nếu thông tin hôn nhân đã được cập nhật trên CSDL Quốc gia về dân cư.' },

        { checklistId: 'ks-5', caseCode: 'KHAI_SINH_QUA_HAN', submissionType: 'NOP', itemName: 'Tờ khai đăng ký khai sinh quá hạn', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Kèm văn bản giải trình lý do chưa đăng ký trong thời hạn luật định.' },
        { checklistId: 'ks-6', caseCode: 'KHAI_SINH_QUA_HAN', submissionType: 'NOP', itemName: 'Giấy chứng sinh hoặc tài liệu chứng minh sự kiện sinh', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Bản chính giấy chứng sinh hoặc văn bản xác nhận của trạm y tế / người làm chứng.' },
        { checklistId: 'ks-7', caseCode: 'KHAI_SINH_QUA_HAN', submissionType: 'XUAT_TRINH', itemName: 'CCCD / Hộ chiếu người yêu cầu và cha mẹ', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },

        { checklistId: 'ks-8', caseCode: 'KHAI_SINH_CHUA_KET_HON', submissionType: 'NOP', itemName: 'Tờ khai đăng ký khai sinh', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
        { checklistId: 'ks-9', caseCode: 'KHAI_SINH_CHUA_KET_HON', submissionType: 'NOP', itemName: 'Tờ khai đăng ký nhận cha, mẹ, con', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Mẫu theo Thông tư 04/2020/TT-BTP.' },
        { checklistId: 'ks-10', caseCode: 'KHAI_SINH_CHUA_KET_HON', submissionType: 'NOP', itemName: 'Văn bản chứng cứ chứng minh quan hệ cha con (Kết quả xét nghiệm ADN hoặc biên bản cam đoan)', documentCopyType: 'CERTIFIED_COPY', quantity: 1, isMandatory: true, conditionNote: 'Bản sao chứng thực kết luận giám định gen hoặc văn bản có xác nhận của ít nhất 2 người thân thích.' },
        { checklistId: 'ks-11', caseCode: 'KHAI_SINH_CHUA_KET_HON', submissionType: 'NOP', itemName: 'Giấy chứng sinh của trẻ', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
        { checklistId: 'ks-12', caseCode: 'KHAI_SINH_CHUA_KET_HON', submissionType: 'XUAT_TRINH', itemName: 'CCCD của cả cha và mẹ', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true }
      ]
    };
  }

  if (title === 'Đăng ký kết hôn') {
    return {
      cases: [
        {
          caseCode: 'KET_HON_CONG_DAN_TRONG_NUOC',
          caseName: 'Đăng ký kết hôn giữa hai công dân Việt Nam cư trú trong nước',
          description: 'Hai bên nam nữ đều là công dân Việt Nam, cư trú tại địa bàn cấp xã tiếp nhận hồ sơ.',
          steps: [
            { stepOrder: 1, stepName: 'Nộp hồ sơ trực tuyến hoặc tại quầy', executor: 'Hai bên nam nữ', actionDetails: 'Cả hai bên cùng có mặt tại UBND xã/phường hoặc nộp qua Cổng dịch vụ công.' },
            { stepOrder: 2, stepName: 'Kiểm tra điều kiện kết hôn', executor: 'Công chức Tư pháp - Hộ tịch', actionDetails: 'Kiểm tra độ tuổi (nam từ đủ 20, nữ từ đủ 18), sự tự nguyện và tình trạng hôn nhân của hai bên.' },
            { stepOrder: 3, stepName: 'Ký Giấy chứng nhận kết hôn', executor: 'Chủ tịch UBND & Hai bên nam nữ', actionDetails: 'Hai bên ký vào Sổ hộ tịch và Giấy chứng nhận kết hôn; Chủ tịch UBND trao Giấy chứng nhận.' }
          ]
        },
        {
          caseCode: 'KET_HON_KHAC_XA',
          caseName: 'Đăng ký kết hôn khi một bên cư trú ở xã/tỉnh khác',
          description: 'Trường hợp một bên không có nơi thường trú tại xã tiếp nhận đăng ký kết hôn.',
          steps: [
            { stepOrder: 1, stepName: 'Xin Giấy xác nhận tình trạng hôn nhân nơi cư trú cũ', executor: 'Bên cư trú nơi khác', actionDetails: 'Xin giấy xác nhận độc thân tại UBND xã nơi thường trú trước đó.' },
            { stepOrder: 2, stepName: 'Nộp hồ sơ kết hôn tại UBND xã đối tác', executor: 'Hai bên nam nữ', actionDetails: 'Nộp hồ sơ kèm Giấy xác nhận tình trạng hôn nhân.' },
            { stepOrder: 3, stepName: 'Giải quyết và trao giấy kết hôn', executor: 'UBND cấp xã nơi tiếp nhận', actionDetails: 'Hoàn tất thủ tục và trao 02 bản chính Giấy chứng nhận kết hôn.' }
          ]
        }
      ],
      checklist: [
        { checklistId: 'kh-1', caseCode: 'KET_HON_CONG_DAN_TRONG_NUOC', submissionType: 'NOP', itemName: 'Tờ khai đăng ký kết hôn (mẫu ban hành theo TT 04/2020/TT-BTP)', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Hai bên cùng ký tên vào tờ khai chung hoặc kê khai riêng nếu ở xa.', templateUrl: 'https://dichvucong.gov.vn/p/home/dvc-mau-to-khai-ket-hon.docx', templateFormat: 'DOCX' },
        { checklistId: 'kh-2', caseCode: 'KET_HON_CONG_DAN_TRONG_NUOC', submissionType: 'XUAT_TRINH', itemName: 'Căn cước công dân / Hộ chiếu của hai bên nam, nữ', documentCopyType: 'ORIGINAL', quantity: 2, isMandatory: true, conditionNote: 'Xuất trình bản chính còn hạn hoặc tài khoản VNeID định danh điện tử Mức 2.' },
        { checklistId: 'kh-3', caseCode: 'KET_HON_CONG_DAN_TRONG_NUOC', submissionType: 'NOP', itemName: 'Trích lục ghi chú ly hôn (nếu đã từng ly hôn trước đó)', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: false, conditionNote: 'Chỉ yêu cầu đối với người đã từng ly hôn hoặc vợ/chồng trước đã qua đời.' },

        { checklistId: 'kh-4', caseCode: 'KET_HON_KHAC_XA', submissionType: 'NOP', itemName: 'Tờ khai đăng ký kết hôn', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
        { checklistId: 'kh-5', caseCode: 'KET_HON_KHAC_XA', submissionType: 'NOP', itemName: 'Giấy xác nhận tình trạng hôn nhân của bên cư trú tại địa phương khác', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Có giá trị trong 6 tháng kể từ ngày cấp, do UBND cấp xã nơi thường trú của bên đó cấp.' },
        { checklistId: 'kh-6', caseCode: 'KET_HON_KHAC_XA', submissionType: 'XUAT_TRINH', itemName: 'Căn cước công dân của hai bên', documentCopyType: 'ORIGINAL', quantity: 2, isMandatory: true }
      ]
    };
  }

  if (title.includes('Chứng thực bản sao')) {
    return {
      cases: [
        {
          caseCode: 'CHUNG_THUC_BAN_CHINH',
          caseName: 'Chứng thực bản sao từ bản chính văn bản giấy',
          description: 'Áp dụng cho mọi loại giấy tờ do cơ quan, tổ chức có thẩm quyền của Việt Nam cấp.',
          steps: [
            { stepOrder: 1, stepName: 'Xuất trình bản chính và nộp bản chụp', executor: 'Người yêu cầu chứng thực', actionDetails: 'Người yêu cầu xuất trình bản chính giấy tờ và nộp bản chụp cần chứng thực (hoặc yêu cầu UBND tự photocopy).' },
            { stepOrder: 2, stepName: 'Đối chiếu và thẩm định', executor: 'Công chức Tư pháp - Hộ tịch', actionDetails: 'Kiểm tra bản chính không bị tẩy xóa, rách nát, chắp vá; đối chiếu từng trang bản sao.' },
            { stepOrder: 3, stepName: 'Đóng dấu lời chứng và thu phí', executor: 'Chủ tịch/Phó Chủ tịch UBND', actionDetails: 'Ký và đóng dấu lời chứng thực; trả kết quả ngay trong ngày tiếp nhận.' }
          ]
        },
        {
          caseCode: 'CHUNG_THUC_DIEN_TU',
          caseName: 'Chứng thực bản sao điện tử từ bản chính',
          description: 'Cấp bản sao điện tử có chữ ký số để người dân thực hiện các dịch vụ công trực tuyến.',
          steps: [
            { stepOrder: 1, stepName: 'Xuất trình bản chính tại quầy', executor: 'Người yêu cầu', actionDetails: 'Cung cấp mã tài khoản dịch vụ công hoặc email để nhận bản sao số.' },
            { stepOrder: 2, stepName: 'Scan và ký số văn bản', executor: 'Cán bộ Một cửa', actionDetails: 'Quét kỹ thuật số màu toàn bộ văn bản và ký số cơ quan.' },
            { stepOrder: 3, stepName: 'Chuyển bản sao điện tử vào kho dữ liệu công dân', executor: 'Hệ thống Một cửa', actionDetails: 'Kết quả tự động trả về kho tài liệu cá nhân trên Cổng DVC.' }
          ]
        }
      ],
      checklist: [
        { checklistId: 'ct-1', caseCode: 'CHUNG_THUC_BAN_CHINH', submissionType: 'XUAT_TRINH', itemName: 'Bản chính giấy tờ, văn bản cần chứng thực', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Bản chính phải còn nguyên vẹn, rõ chữ, có con dấu và chữ ký hợp lệ của cơ quan ban hành.' },
        { checklistId: 'ct-2', caseCode: 'CHUNG_THUC_BAN_CHINH', submissionType: 'NOP', itemName: 'Bản chụp/photocopy giấy tờ cần chứng thực', documentCopyType: 'REGULAR_COPY', quantity: 1, isMandatory: true, conditionNote: 'Có thể tự chuẩn bị trước hoặc yêu cầu cơ quan thực hiện chứng thực sao chụp.' },
        { checklistId: 'ct-3', caseCode: 'CHUNG_THUC_BAN_CHINH', submissionType: 'XUAT_TRINH', itemName: 'Căn cước công dân của người yêu cầu chứng thực', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Để đối chiếu nhân thân người thực hiện giao dịch.' },

        { checklistId: 'ct-4', caseCode: 'CHUNG_THUC_DIEN_TU', submissionType: 'XUAT_TRINH', itemName: 'Bản chính giấy tờ cần chứng thực điện tử', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
        { checklistId: 'ct-5', caseCode: 'CHUNG_THUC_DIEN_TU', submissionType: 'XUAT_TRINH', itemName: 'Mã định danh cá nhân / CCCD gắn chip', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Cần có tài khoản Dịch vụ công hoặc VNeID để nhận file ký số.' }
      ]
    };
  }

  // Mặc định cho các thủ tục khác
  return {
    cases: [
      {
        caseCode: 'TRUONG_HOP_THONG_THUONG',
        caseName: 'Trường hợp thông thường (Công dân trực tiếp thực hiện)',
        description: 'Áp dụng cho người dân đủ điều kiện pháp luật tự mình trực tiếp làm hồ sơ hoặc nộp trực tuyến.',
        steps: [
          { stepOrder: 1, stepName: 'Chuẩn bị và nộp hồ sơ', executor: 'Công dân', actionDetails: 'Điền đơn theo mẫu và nộp các giấy tờ theo danh mục checklist yêu cầu.' },
          { stepOrder: 2, stepName: 'Tiền kiểm và thụ lý hồ sơ', executor: 'Cán bộ Một cửa tiếp nhận', actionDetails: 'Kiểm tra tính pháp lý, đối chiếu dữ liệu điện tử và hướng dẫn bổ sung nếu thiếu sót.' },
          { stepOrder: 3, stepName: 'Giải quyết và trả kết quả', executor: 'UBND cấp xã / Cơ quan chức năng', actionDetails: 'Trả kết quả giấy hẹn hoặc trả kết quả bản điện tử qua Cổng dịch vụ công.' }
        ]
      },
      {
        caseCode: 'TRUONG_HOP_UY_QUYEN',
        caseName: 'Trường hợp nộp thay / Người đại diện theo ủy quyền',
        description: 'Áp dụng khi người có quyền và nghĩa vụ không trực tiếp đến làm việc và ủy quyền hợp pháp cho người khác.',
        steps: [
          { stepOrder: 1, stepName: 'Nộp hồ sơ kèm văn bản ủy quyền', executor: 'Người được ủy quyền', actionDetails: 'Nộp giấy ủy quyền có công chứng/chứng thực cùng các thành phần hồ sơ theo quy định.' },
          { stepOrder: 2, stepName: 'Kiểm tra phạm vi ủy quyền', executor: 'Cán bộ Tư pháp', actionDetails: 'Xem xét tư cách đại diện và nội dung ủy quyền phù hợp với nội dung thủ tục.' },
          { stepOrder: 3, stepName: 'Trả kết quả cho người đại diện', executor: 'Bộ phận tiếp nhận Một cửa', actionDetails: 'Người được ủy quyền ký nhận kết quả thay cho người ủy quyền.' }
        ]
      }
    ],
    checklist: [
      { checklistId: 'df-1', caseCode: 'TRUONG_HOP_THONG_THUONG', submissionType: 'NOP', itemName: `Đơn / Tờ khai ${title}`, documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Kê khai trung thực, ký và ghi rõ họ tên theo mẫu quy định.', templateUrl: 'https://dichvucong.gov.vn/p/home/dvc-bieu-mau.docx', templateFormat: 'DOCX' },
      { checklistId: 'df-2', caseCode: 'TRUONG_HOP_THONG_THUONG', submissionType: 'XUAT_TRINH', itemName: 'Căn cước công dân / Căn cước / Hộ chiếu người yêu cầu', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Bản chính còn hạn sử dụng hoặc tài khoản định danh VNeID Mức 2.' },
      { checklistId: 'df-3', caseCode: 'TRUONG_HOP_THONG_THUONG', submissionType: 'NOP', itemName: 'Giấy tờ chứng minh nội dung liên quan (nếu có)', documentCopyType: 'CERTIFIED_COPY', quantity: 1, isMandatory: false, conditionNote: 'Nộp kèm bản sao chứng thực nếu cơ quan có yêu cầu xác minh thêm.' },

      { checklistId: 'df-4', caseCode: 'TRUONG_HOP_UY_QUYEN', submissionType: 'NOP', itemName: `Đơn / Tờ khai ${title}`, documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
      { checklistId: 'df-5', caseCode: 'TRUONG_HOP_UY_QUYEN', submissionType: 'NOP', itemName: 'Văn bản ủy quyền theo quy định của pháp luật', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true, conditionNote: 'Phải được công chứng hoặc chứng thực chữ ký theo luật định (trừ trường hợp cha mẹ ủy quyền cho con hoặc ngược lại theo quy định riêng).' },
      { checklistId: 'df-6', caseCode: 'TRUONG_HOP_UY_QUYEN', submissionType: 'XUAT_TRINH', itemName: 'CCCD của người được ủy quyền và người ủy quyền', documentCopyType: 'ORIGINAL', quantity: 2, isMandatory: true }
    ]
  };
};

export const mockPublicProcedures = [
  ...popularProcedures.map(({ title, category }) => ({ title, category })),
  { title: 'Đăng ký khai tử', category: 'Hộ tịch' },
  { title: 'Đăng ký lại khai sinh', category: 'Hộ tịch' },
  { title: 'Đăng ký lại kết hôn', category: 'Hộ tịch' },
  { title: 'Cấp bản sao trích lục hộ tịch', category: 'Hộ tịch' },
  { title: 'Thay đổi, cải chính thông tin hộ tịch', category: 'Hộ tịch' },
  { title: 'Chứng thực chữ ký', category: 'Chứng thực' },
  { title: 'Chứng thực hợp đồng, giao dịch', category: 'Chứng thực' },
  { title: 'Chứng thực chữ ký người dịch', category: 'Chứng thực' },
  { title: 'Đề nghị xác định mức độ khuyết tật', category: 'Chính sách xã hội' },
  { title: 'Đề nghị hỗ trợ chi phí mai táng', category: 'Chính sách xã hội' },
].map((procedure, index) => {
  const details = getProcedureDetailsMock(procedure.title);
  return {

    ...procedure,
    id: 'demo-' + (index + 1),
    checklist_schema: details.checklist,
    content_payload: {
      schemaVersion: 1,
      overview: 'Trang minh họa thông tin về ' + procedure.title.toLowerCase() + '. Nội dung và điều kiện áp dụng sẽ được cập nhật sau khi được xác minh.',
      methods: ['Trực tiếp', 'Trực tuyến', 'Dịch vụ bưu chính'].map((method) => ({
        method,
        processingTime: method === 'Trực tiếp' ? '1 ngày làm việc' : 'Trong ngày hoặc ngày làm việc tiếp theo',
        fee: procedure.category === 'Chứng thực' ? '5.000 VNĐ / trang' : 'Miễn phí cho công dân',
        notes: 'Chưa xác nhận điều kiện áp dụng hoặc miễn, giảm.',
      })),
      cases: details.cases,
      legalBases: [
        { number: '112/2020/NĐ-CP', title: 'Nghị định quy định về cơ chế một cửa, một cửa liên thông trong giải quyết thủ tục hành chính', url: 'https://thuvienphapluat.vn/' },
        { number: '23/2015/NĐ-CP', title: 'Nghị định về cấp bản sao từ sổ gốc, chứng thực bản sao từ bản chính, chứng thực chữ ký', url: 'https://thuvienphapluat.vn/' }
      ],
      receivingAgencies: [
        { name: 'Bộ phận Tiếp nhận và Trả kết quả (Một cửa) UBND cấp xã / phường', address: 'Trụ sở UBND xã/phường nơi cư trú hoặc tiếp nhận', url: 'https://dichvucong.gov.vn/' }
      ],
    },
    description: {
      'Hộ tịch': 'Tra cứu hướng dẫn chuẩn bị thông tin và giấy tờ hộ tịch.',
      'Chứng thực': 'Tra cứu hướng dẫn chuẩn bị giấy tờ cần chứng thực.',
      'Chính sách xã hội': 'Tra cứu hướng dẫn chuẩn bị thông tin đề nghị hỗ trợ.',
    }[procedure.category],
  };
});

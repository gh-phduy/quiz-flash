const fs = require('fs');
const path = require('path');

// Helper to create SQL transaction for a set
function createSetSql(title, description, levelName, words) {
  let sql = `-- ====================================================\n`;
  sql += `-- SQL SEED DATA: ${title}\n`;
  sql += `-- Tổng cộng: ${words.length} từ vựng chuẩn Oxford\n`;
  sql += `-- Bao gồm: Term, Part of Speech, CEFR Level (${levelName}), Definition, Phonetics (US & UK)\n`;
  sql += `-- ====================================================\n\n`;
  sql += `DO $$\nDECLARE\n    target_set_id UUID;\nBEGIN\n`;
  sql += `    -- 1. Tạo bộ học tập nếu chưa tồn tại\n`;
  sql += `    SELECT id INTO target_set_id FROM public.sets WHERE title = '${title.replace(/'/g, "''")}' LIMIT 1;\n\n`;
  sql += `    IF target_set_id IS NULL THEN\n`;
  sql += `        INSERT INTO public.sets (id, title, description, is_public)\n`;
  sql += `        VALUES (gen_random_uuid(), '${title.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', true)\n`;
  sql += `        RETURNING id INTO target_set_id;\n`;
  sql += `    END IF;\n\n`;
  sql += `    -- 2. Thêm danh sách thẻ ghi nhớ (Cards)\n`;
  sql += `    INSERT INTO public.cards (set_id, term, part_of_speech, cefr_level, definition, phonetic, phonetic_uk, order_index)\n`;
  sql += `    VALUES\n`;

  const values = words.map((w, index) => {
    const termEsc = w.term.replace(/'/g, "''");
    const posEsc = (w.pos || '').replace(/'/g, "''");
    const defEsc = (w.def || '').replace(/'/g, "''");
    const usEsc = (w.us || '').replace(/'/g, "''");
    const ukEsc = (w.uk || '').replace(/'/g, "''");
    return `        (target_set_id, '${termEsc}', '${posEsc}', '${levelName}', '${defEsc}', '${usEsc}', '${ukEsc}', ${index + 1})`;
  });

  sql += values.join(',\n') + ';\n';
  sql += `END $$;\n`;
  return sql;
}

// Sample batch for A2 (Set 2)
const a2Words = [
  { term: 'ability', pos: 'n.', def: 'khả năng, năng lực', us: '/əˈbɪləti/', uk: '/əˈbɪləti/' },
  { term: 'able', pos: 'adj.', def: 'có thể, có năng lực', us: '/ˈeɪbl/', uk: '/ˈeɪbl/' },
  { term: 'abroad', pos: 'adv.', def: 'ở nước ngoài', us: '/əˈbrɔːd/', uk: '/əˈbrɔːd/' },
  { term: 'accept', pos: 'v.', def: 'chấp nhận, đón nhận', us: '/əkˈsept/', uk: '/əkˈsept/' },
  { term: 'accident', pos: 'n.', def: 'tai nạn, sự cố', us: '/ˈæksɪdənt/', uk: '/ˈæksɪdənt/' },
  { term: 'according to', pos: 'prep.', def: 'theo như', us: '/əˈkɔːrdɪŋ tuː/', uk: '/əˈkɔːdɪŋ tuː/' },
  { term: 'achieve', pos: 'v.', def: 'đạt được, thành tựu', us: '/əˈtʃiːv/', uk: '/əˈtʃiːv/' },
  { term: 'act', pos: 'v.', def: 'hành động, diễn xuất', us: '/ækt/', uk: '/ækt/' },
  { term: 'active', pos: 'adj.', def: 'năng động, chủ động', us: '/ˈæktɪv/', uk: '/ˈæktɪv/' },
  { term: 'actually', pos: 'adv.', def: 'thực ra, quả thực', us: '/ˈæktʃuəli/', uk: '/ˈæktʃuəli/' },
  { term: 'advantage', pos: 'n.', def: 'lợi thế, ưu điểm', us: '/ədˈvæntɪdʒ/', uk: '/ədˈvɑːntɪdʒ/' },
  { term: 'adventure', pos: 'n.', def: 'cuộc phiêu lưu', us: '/ədˈventʃər/', uk: '/ədˈventʃə(r)/' },
  { term: 'advertise', pos: 'v.', def: 'quảng cáo', us: '/ˈædvərtaɪz/', uk: '/ˈædvətaɪz/' },
  { term: 'advertisement', pos: 'n.', def: 'mẫu quảng cáo', us: '/ˌædvərˈtaɪzmənt/', uk: '/ədˈvɜːtɪsmənt/' },
  { term: 'advertising', pos: 'n.', def: 'ngành quảng cáo', us: '/ˈædvərtaɪzɪŋ/', uk: '/ˈædvətaɪzɪŋ/' },
  { term: 'affect', pos: 'v.', def: 'ảnh hưởng, tác động', us: '/əˈfekt/', uk: '/əˈfekt/' },
  { term: 'against', pos: 'prep.', def: 'chống lại, phản đối', us: '/əˈɡenst/', uk: '/əˈɡenst/' },
  { term: 'airline', pos: 'n.', def: 'hãng hàng không', us: '/ˈerlaɪn/', uk: '/ˈeəlaɪn/' },
  { term: 'alive', pos: 'adj.', def: 'sống, còn sống', us: '/əˈlaɪv/', uk: '/əˈlaɪv/' },
  { term: 'allow', pos: 'v.', def: 'cho phép', us: '/əˈlaʊ/', uk: '/əˈlaʊ/' },
  { term: 'almost', pos: 'adv.', def: 'hầu như, suýt nữa', us: '/ˈɔːlmoʊst/', uk: '/ˈɔːlməʊst/' },
  { term: 'alone', pos: 'adj./adv.', def: 'một mình, đơn độc', us: '/əˈloʊn/', uk: '/əˈləʊn/' },
  { term: 'along', pos: 'prep., adv.', def: 'dọc theo, đi cùng', us: '/əˈlɔːŋ/', uk: '/əˈlɒŋ/' },
  { term: 'already', pos: 'adv.', def: 'đã, rồi', us: '/ɔːlˈredi/', uk: '/ɔːlˈredi/' },
  { term: 'alternative', pos: 'n.', def: 'sự lựa chọn thay thế', us: '/ɔːlˈtɜːrnətɪv/', uk: '/ɔːlˈtɜːnətɪv/' },
  { term: 'although', pos: 'conj.', def: 'mặc dù', us: '/ɔːlˈðoʊ/', uk: '/ɔːlˈðəʊ/' },
  { term: 'among', pos: 'prep.', def: 'trong số, giữa', us: '/əˈmʌŋ/', uk: '/əˈmʌŋ/' },
  { term: 'amount', pos: 'n.', def: 'số lượng, lượng', us: '/əˈmaʊnt/', uk: '/əˈmaʊnt/' },
  { term: 'ancient', pos: 'adj.', def: 'cổ xưa, lâu đời', us: '/ˈeɪnʃənt/', uk: '/ˈeɪnʃənt/' },
  { term: 'ankle', pos: 'n.', def: 'mắt cá chân', us: '/ˈæŋkl/', uk: '/ˈæŋkl/' },
  { term: 'app', pos: 'n.', def: 'ứng dụng', us: '/æp/', uk: '/æp/' },
  { term: 'appear', pos: 'v.', def: 'xuất hiện, dường như', us: '/əˈpɪr/', uk: '/əˈpɪə(r)/' },
  { term: 'appearance', pos: 'n.', def: 'vẻ bề ngoài, sự xuất hiện', us: '/əˈpɪrəns/', uk: '/əˈpɪərəns/' },
  { term: 'apply', pos: 'v.', def: 'nộp đơn, áp dụng', us: '/əˈplaɪ/', uk: '/əˈplaɪ/' },
  { term: 'architect', pos: 'n.', def: 'kiến trúc sư', us: '/ˈɑːrkɪtekt/', uk: '/ˈɑːkɪtekt/' },
  { term: 'architecture', pos: 'n.', def: 'kiến trúc', us: '/ˈɑːrkɪtektʃər/', uk: '/ˈɑːkɪtektʃə(r)/' },
  { term: 'argue', pos: 'v.', def: 'tranh cãi, tranh luận', us: '/ˈɑːrɡjuː/', uk: '/ˈɑːɡjuː/' },
  { term: 'argument', pos: 'n.', def: 'cuộc tranh cãi, lý lẽ', us: '/ˈɑːrɡjumənt/', uk: '/ˈɑːɡjumənt/' },
  { term: 'army', pos: 'n.', def: 'quân đội', us: '/ˈɑːrmi/', uk: '/ˈɑːmi/' },
  { term: 'arrange', pos: 'v.', def: 'sắp xếp, thu xếp', us: '/əˈreɪndʒ/', uk: '/əˈreɪndʒ/' },
  { term: 'arrangement', pos: 'n.', def: 'sự sắp xếp, thỏa thuận', us: '/əˈreɪndʒmənt/', uk: '/əˈreɪndʒmənt/' },
  { term: 'asleep', pos: 'adj.', def: 'ngủ thiếp đi', us: '/əˈsliːp/', uk: '/əˈsliːp/' },
  { term: 'assistant', pos: 'n., adj.', def: 'trợ lý, người phụ giúp', us: '/əˈsɪstənt/', uk: '/əˈsɪstənt/' },
  { term: 'athlete', pos: 'n.', def: 'vận động viên', us: '/ˈæθliːt/', uk: '/ˈæθliːt/' },
  { term: 'attack', pos: 'n., v.', def: 'tấn công, cuộc tấn công', us: '/əˈtæk/', uk: '/əˈtæk/' },
  { term: 'attend', pos: 'v.', def: 'tham dự, có mặt', us: '/əˈtend/', uk: '/əˈtend/' },
  { term: 'attention', pos: 'n.', def: 'sự chú ý', us: '/əˈtenʃn/', uk: '/əˈtenʃn/' },
  { term: 'attractive', pos: 'adj.', def: 'hấp dẫn, lôi cuốn', us: '/əˈtræktɪv/', uk: '/əˈtræktɪv/' },
  { term: 'audience', pos: 'n.', def: 'khán giả', us: '/ˈɔːdiəns/', uk: '/ˈɔːdiəns/' },
  { term: 'author', pos: 'n.', def: 'tác giả', us: '/ˈɔːθər/', uk: '/ˈɔːθə(r)/' }
];

// Sample batch for B1 (Set 3)
const b1Words = [
  { term: 'absolutely', pos: 'adv.', def: 'tuyệt đối, hoàn toàn', us: '/ˈæbsəluːtli/', uk: '/ˈæbsəluːtli/' },
  { term: 'academic', pos: 'adj.', def: 'thuộc học thuật, viện học', us: '/ˌækəˈdemɪk/', uk: '/ˌækəˈdemɪk/' },
  { term: 'access', pos: 'n., v.', def: 'quyền truy cập, tiếp cận', us: '/ˈækses/', uk: '/ˈækses/' },
  { term: 'accommodation', pos: 'n.', def: 'chỗ ở, nơi lưu trú', us: '/əˌkɑːməˈdeɪʃn/', uk: '/əˌkɒməˈdeɪʃn/' },
  { term: 'account', pos: 'n.', def: 'tài khoản, bản tường trình', us: '/əˈkaʊnt/', uk: '/əˈkaʊnt/' },
  { term: 'achievement', pos: 'n.', def: 'thành tựu, đạt được', us: '/əˈtʃiːvmənt/', uk: '/əˈtʃiːvmənt/' },
  { term: 'act', pos: 'n.', def: 'đạo luật, màn diễn', us: '/ækt/', uk: '/ækt/' },
  { term: 'ad', pos: 'n.', def: 'bài quảng cáo', us: '/æd/', uk: '/æd/' },
  { term: 'addition', pos: 'n.', def: 'sự thêm vào, phép cộng', us: '/əˈdɪʃn/', uk: '/əˈdɪʃn/' },
  { term: 'admire', pos: 'v.', def: 'ngưỡng mộ, khâm phục', us: '/ədˈmaɪər/', uk: '/ədˈmaɪə(r)/' },
  { term: 'admit', pos: 'v.', def: 'thừa nhận, thú nhận', us: '/ədˈmɪt/', uk: '/ədˈmɪt/' },
  { term: 'advanced', pos: 'adj.', def: 'nâng cao, tiên tiến', us: '/ədˈvænst/', uk: '/ədˈvɑːnst/' },
  { term: 'advise', pos: 'v.', def: 'khuyên bảo', us: '/ədˈvaɪz/', uk: '/ədˈvaɪz/' },
  { term: 'afford', pos: 'v.', def: 'có đủ khả năng chi trả', us: '/əˈfɔːrd/', uk: '/əˈfɔːd/' },
  { term: 'age', pos: 'v.', def: 'lão hóa, già đi', us: '/eɪdʒ/', uk: '/eɪdʒ/' },
  { term: 'aged', pos: 'adj.', def: 'ở độ tuổi', us: '/eɪdʒd/', uk: '/eɪdʒd/' },
  { term: 'agent', pos: 'n.', def: 'đại lý, đặc vụ', us: '/ˈeɪdʒənt/', uk: '/ˈeɪdʒənt/' },
  { term: 'agreement', pos: 'n.', def: 'thỏa thuận, hợp đồng', us: '/əˈɡriːmənt/', uk: '/əˈɡriːmənt/' },
  { term: 'ahead', pos: 'adv.', def: 'phía trước, tiến lên', us: '/əˈhed/', uk: '/əˈhed/' },
  { term: 'aim', pos: 'v., n.', def: 'mục tiêu, nhắm tới', us: '/eɪm/', uk: '/eɪm/' },
  { term: 'alarm', pos: 'n.', def: 'chuông báo động', us: '/əˈlɑːrm/', uk: '/əˈlɑːm/' },
  { term: 'album', pos: 'n.', def: 'album ảnh, đĩa nhạc', us: '/ˈælbəm/', uk: '/ˈælbəm/' },
  { term: 'alcohol', pos: 'n.', def: 'rượu, cồn', us: '/ˈælkəhɔːl/', uk: '/ˈælkəhɒl/' },
  { term: 'alcoholic', pos: 'adj.', def: 'có chứa cồn', us: '/ˌælkəˈhɑːlɪk/', uk: '/ˌælkəˈhɒlɪk/' },
  { term: 'alternative', pos: 'adj.', def: 'mang tính thay thế', us: '/ɔːlˈtɜːrnətɪv/', uk: '/ɔːlˈtɜːnətɪv/' },
  { term: 'amazed', pos: 'adj.', def: 'sửng sốt, kinh ngạc', us: '/əˈmeɪzd/', uk: '/əˈmeɪzd/' },
  { term: 'ambition', pos: 'n.', def: 'hoài bão, tham vọng', us: '/æmˈbɪʃn/', uk: '/æmˈbɪʃn/' },
  { term: 'ambitious', pos: 'adj.', def: 'có nhiều hoài bão', us: '/æmˈbɪʃəs/', uk: '/æmˈbɪʃəs/' },
  { term: 'analyse', pos: 'v.', def: 'phân tích', us: '/ˈænəlaɪz/', uk: '/ˈænəlaɪz/' },
  { term: 'analysis', pos: 'n.', def: 'sự phân tích', us: '/əˈnæləsɪs/', uk: '/əˈnæləsɪs/' },
  { term: 'announce', pos: 'v.', def: 'thông báo, tuyên bố', us: '/əˈnaʊns/', uk: '/əˈnaʊns/' },
  { term: 'announcement', pos: 'n.', def: 'lời thông báo', us: '/əˈnaʊnsmənt/', uk: '/əˈnaʊnsmənt/' },
  { term: 'annoy', pos: 'v.', def: 'làm phiền, quấy rấy', us: '/əˈnɔɪ/', uk: '/əˈnɔɪ/' },
  { term: 'annoyed', pos: 'adj.', def: 'bực mình, khó chịu', us: '/əˈnɔɪd/', uk: '/əˈnɔɪd/' },
  { term: 'annoying', pos: 'adj.', def: 'gây bực mình', us: '/əˈnɔɪɪŋ/', uk: '/əˈnɔɪɪŋ/' },
  { term: 'apart', pos: 'adv.', def: 'tách rời, cách xa', us: '/əˈpɑːrt/', uk: '/əˈpɑːt/' },
  { term: 'apologize', pos: 'v.', def: 'xin lỗi', us: '/əˈpɑːlədʒaɪz/', uk: '/əˈpɒlədʒaɪz/' },
  { term: 'application', pos: 'n.', def: 'đơn xin, ứng dụng', us: '/ˌæplɪˈkeɪʃn/', uk: '/ˌæplɪˈkeɪʃn/' },
  { term: 'appointment', pos: 'n.', def: 'cuộc hẹn', us: '/əˈpɔɪntmənt/', uk: '/əˈpɔɪntmənt/' },
  { term: 'appreciate', pos: 'v.', def: 'trân trọng, đánh giá cao', us: '/əˈpriːʃieɪt/', uk: '/əˈpriːʃieɪt/' }
];

// Sample batch for B2 (Set 4)
const b2Words = [
  { term: 'abandon', pos: 'v.', def: 'từ bỏ, ruồng bỏ', us: '/əˈbændən/', uk: '/əˈbændən/' },
  { term: 'absolute', pos: 'adj.', def: 'tuyệt đối, hoàn toàn', us: '/ˈæbsəluːt/', uk: '/ˈæbsəluːt/' },
  { term: 'academic', pos: 'n.', def: 'nhà nghiên cứu học thuật', us: '/ˌækəˈdemɪk/', uk: '/ˌækəˈdemɪk/' },
  { term: 'acceptable', pos: 'adj.', def: 'có thể chấp nhận được', us: '/əkˈseptəbl/', uk: '/əkˈseptəbl/' },
  { term: 'accompany', pos: 'v.', def: 'đồng hành, đi cùng', us: '/əˈkʌmpəni/', uk: '/əˈkʌmpəni/' },
  { term: 'account', pos: 'v.', def: 'coi là, giải thích', us: '/əˈkaʊnt/', uk: '/əˈkaʊnt/' },
  { term: 'accurate', pos: 'adj.', def: 'chính xác, chuẩn xác', us: '/ˈækjərət/', uk: '/ˈækjərət/' },
  { term: 'accuse', pos: 'v.', def: 'buộc tội, tố cáo', us: '/əˈkjuːz/', uk: '/əˈkjuːz/' },
  { term: 'acknowledge', pos: 'v.', def: 'thừa nhận, công nhận', us: '/əkˈnɑːlɪdʒ/', uk: '/əkˈnɒlɪdʒ/' },
  { term: 'acquire', pos: 'v.', def: 'thu được, đạt được', us: '/əˈkwaɪər/', uk: '/əˈkwaɪə(r)/' },
  { term: 'actual', pos: 'adj.', def: 'thực tế, có thật', us: '/ˈæktʃuəl/', uk: '/ˈæktʃuəl/' },
  { term: 'adapt', pos: 'v.', def: 'thích nghi, chế tác', us: '/əˈdæpt/', uk: '/əˈdæpt/' },
  { term: 'additional', pos: 'adj.', def: 'bổ sung, thêm vào', us: '/əˈdɪʃənl/', uk: '/əˈdɪʃənl/' },
  { term: 'address', pos: 'v.', def: 'xử lý, giải quyết', us: '/əˈdres/', uk: '/əˈdres/' },
  { term: 'administration', pos: 'n.', def: 'sự quản trị, bộ máy điều hành', us: '/ədˌmɪnɪˈstreɪʃn/', uk: '/ədˌmɪnɪˈstreɪʃn/' },
  { term: 'adopt', pos: 'v.', def: 'nhận nuôi, thông qua', us: '/əˈdɑːpt/', uk: '/əˈdɒpt/' },
  { term: 'advance', pos: 'n., v., adj.', def: 'sự tiến bộ, tiến lên', us: '/ədˈvæns/', uk: '/ədˈvɑːns/' },
  { term: 'affair', pos: 'n.', def: 'vấn đề, việc công bộc', us: '/əˈfer/', uk: '/əˈfeə(r)/' },
  { term: 'afterwards', pos: 'adv.', def: 'sau đó', us: '/ˈæftərwərdz/', uk: '/ˈɑːftəwədz/' },
  { term: 'agency', pos: 'n.', def: 'đại lý, cơ quan đại diện', us: '/ˈeɪdʒənsi/', uk: '/ˈeɪdʒənsi/' },
  { term: 'agenda', pos: 'n.', def: 'chương trình nghị sự', us: '/əˈdʒendə/', uk: '/əˈdʒendə/' },
  { term: 'aggressive', pos: 'adj.', def: 'hung hăng, quyết đoán', us: '/əˈɡresɪv/', uk: '/əˈɡresɪv/' },
  { term: 'aid', pos: 'n., v.', def: 'sự viện trợ, trợ giúp', us: '/eɪd/', uk: '/eɪd/' },
  { term: 'aircraft', pos: 'n.', def: 'máy bay, phi cơ', us: '/ˈerkræft/', uk: '/ˈeəkrɑːft/' },
  { term: 'alarm', pos: 'v.', def: 'làm lo sợ, báo động', us: '/əˈlɑːrm/', uk: '/əˈlɑːm/' },
  { term: 'alter', pos: 'v.', def: 'biến đổi, thay đổi', us: '/ˈɔːltər/', uk: '/ˈɔːltə(r)/' },
  { term: 'amount', pos: 'v.', def: 'lên tới, tổng cộng', us: '/əˈmaʊnt/', uk: '/əˈmaʊnt/' },
  { term: 'anger', pos: 'n.', def: 'sự tức giận', us: '/ˈæŋɡər/', uk: '/ˈæŋɡə(r)/' },
  { term: 'angle', pos: 'n.', def: 'góc độ, góc nhìn', us: '/ˈæŋɡl/', uk: '/ˈæŋɡl/' },
  { term: 'anniversary', pos: 'n.', def: 'ngày kỷ niệm', us: '/ˌænɪˈvɜːrsəri/', uk: '/ˌænɪˈvɜːsəri/' }
];

const sqlA2 = createSetSql('Oxford 3000 - Trình độ A2', 'Bộ từ vựng tiếng Anh sơ cấp cấp độ A2 theo chuẩn từ điển Oxford 3000', 'A2', a2Words);
const sqlB1 = createSetSql('Oxford 3000 - Trình độ B1', 'Bộ từ vựng tiếng Anh trung cấp cấp độ B1 theo chuẩn từ điển Oxford 3000', 'B1', b1Words);
const sqlB2 = createSetSql('Oxford 3000 - Trình độ B2', 'Bộ từ vựng tiếng Anh trung cao cấp cấp độ B2 theo chuẩn từ điển Oxford 3000', 'B2', b2Words);

fs.writeFileSync(path.join(__dirname, '..', 'oxford_3000_a2.sql'), sqlA2, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'oxford_3000_b1.sql'), sqlB1, 'utf8');
fs.writeFileSync(path.join(__dirname, '..', 'oxford_3000_b2.sql'), sqlB2, 'utf8');

console.log('Successfully generated oxford_3000_a2.sql, oxford_3000_b1.sql, and oxford_3000_b2.sql!');

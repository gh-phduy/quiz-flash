import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Đọc file .env.local và nạp biến môi trường thủ công để test
let envFile;
try {
  envFile = fs.readFileSync('.env.local', 'utf8');
} catch (e) {
  console.error('Không tìm thấy file .env.local. Vui lòng tạo file này trước.');
  process.exit(1);
}

const env = {};
envFile.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (!cleanLine || cleanLine.startsWith('#')) return;
  const parts = cleanLine.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Bỏ dấu nháy nếu có
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE')) {
  console.error('Lỗi: Bạn chưa cấu hình NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong file .env.local.');
  process.exit(1);
}

console.log('Đang kết nối thử tới Supabase...');
console.log('Project URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  try {
    // Thử truy vấn một bảng ngẫu nhiên.
    // Nếu kết nối thành công:
    // - Hoặc trả về data (nếu có bảng đó)
    // - Hoặc trả về lỗi Postgres "relation ... does not exist" (có nghĩa là đã gửi request tới database thành công và DB đã xử lý)
    // Nếu API Key sai hoặc URL sai:
    // - Sẽ trả về lỗi 401 Unauthorized hoặc lỗi kết nối mạng (FetchError)
    const { data, error } = await supabase
      .from('connection_test_dummy_table')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.status === 404) {
        console.log('\x1b[32m%s\x1b[0m', '\n✔ Kết nối tới Supabase thành công!');
        console.log('Phản hồi từ Database (Postgres):', error.message);
      } else if (error.status === 401 || error.message.includes('API key')) {
        console.error('\x1b[31m%s\x1b[0m', '\n✘ Kết nối thất bại: API Key (Anon Key) không hợp lệ hoặc đã hết hạn.');
        console.error('Chi tiết lỗi:', error);
      } else {
        console.error('\x1b[31m%s\x1b[0m', '\n✘ Kết nối thất bại. Lỗi database:');
        console.error(error);
      }
    } else {
      console.log('\x1b[32m%s\x1b[0m', '\n✔ Kết nối tới Supabase thành công!');
      console.log('Dữ liệu nhận được (nếu bảng tồn tại):', data);
    }
  } catch (e) {
    console.error('\x1b[31m%s\x1b[0m', '\n✘ Lỗi kết nối mạng hoặc lỗi khởi tạo client:');
    console.error(e);
  }
}

runTest();

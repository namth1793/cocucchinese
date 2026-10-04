import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { assetUrl } from '../../utils/assetUrl';
import { setHomepageContent } from '../../utils/publicSite';

function Field({ label, hint, value, onChange, textarea = false, placeholder }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {textarea
        ? <textarea rows={3} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
      {hint && <small className="hpa-hint">{hint}</small>}
    </div>
  );
}

function ImageField({ label, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/homepage/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Tải ảnh thất bại');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="form-field">
      <label>{label}</label>
      <div className="hpa-image">
        {value ? <img src={assetUrl(value)} alt="" /> : <span className="hpa-image-empty">Chưa có ảnh</span>}
        <div className="hpa-image-actions">
          <label className="btn-secondary hpa-upload">
            <ImagePlus size={15} /> {busy ? 'Đang tải...' : value ? 'Đổi ảnh' : 'Tải ảnh lên'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} disabled={busy} hidden />
          </label>
          {value && <button type="button" className="btn-danger" onClick={() => onChange('')}><Trash2 size={14} /> Bỏ ảnh</button>}
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

/** Danh sách mục (tin tức, video...) - thêm, xoá, đổi thứ tự. `fields` mô tả các ô của 1 mục. */
function ListEditor({ items, onChange, fields, blank, itemTitle, addLabel, max }) {
  const update = (i, key, v) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)));
  const move = (i, d) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="hpa-list">
      {items.map((it, i) => (
        <div key={i} className="hpa-item">
          <div className="hpa-item-head">
            <b>{i + 1}. {itemTitle(it) || '(chưa đặt tên)'}</b>
            <span className="hpa-item-tools">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Lên"><ArrowUp size={15} /></button>
              <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Xuống"><ArrowDown size={15} /></button>
              <button type="button" className="danger" onClick={() => window.confirm('Xoá mục này?') && onChange(items.filter((_, j) => j !== i))} aria-label="Xoá"><Trash2 size={15} /></button>
            </span>
          </div>
          <div className="hpa-grid">
            {fields.map((f) => (f.image
              ? <ImageField key={f.key} label={f.label} value={it[f.key]} onChange={(v) => update(i, f.key, v)} />
              : <Field key={f.key} label={f.label} textarea={f.textarea} placeholder={f.placeholder} value={it[f.key]} onChange={(v) => update(i, f.key, v)} />))}
          </div>
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="btn-secondary" onClick={() => onChange([...items, { ...blank }])}><Plus size={15} /> {addLabel}</button>
      )}
    </div>
  );
}

function Section({ title, desc, children, open = false }) {
  return (
    <details className="hpa-section" open={open}>
      <summary>{title}{desc && <small>{desc}</small>}</summary>
      <div className="hpa-section-body">{children}</div>
    </details>
  );
}

/** Admin tự sửa nội dung trang chủ công khai: liên hệ, banner, lý do chọn, tin tức, video, giảng viên, cảm nhận. */
export default function AdminHomepage() {
  const [data, setData] = useState(null);
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/homepage').then((r) => { setData(r.data); setSaved(JSON.stringify(r.data)); });
  }, []);

  if (!data) return <p className="empty-state">Đang tải...</p>;

  const set = (group, key) => (v) => { setData((d) => ({ ...d, [group]: { ...d[group], [key]: v } })); setMsg(''); };
  const setList = (key) => (v) => { setData((d) => ({ ...d, [key]: v })); setMsg(''); };
  const dirty = JSON.stringify(data) !== saved;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { data: value } = await api.put('/homepage', data);
      setData(value);
      setSaved(JSON.stringify(value));
      setHomepageContent(value);
      setMsg('Đã lưu - trang chủ đã cập nhật.');
    } catch (err) {
      setError(err.response?.data?.error || 'Lưu thất bại, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const { contact, topbar, hero, activity, why, courses, consult, footer } = data;

  return (
    <div className="hpa">
      <h2 style={{ marginTop: 0 }}>Nội dung trang chủ</h2>
      <p className="page-sub">
        Sửa chữ, ảnh và thông tin hiển thị trên trang chủ công khai. Mục <b>Tin tức, Video, Giảng viên, Cảm nhận học viên</b> chỉ hiện
        khi có ít nhất 1 mục. Link có thể là trang nội bộ (<code>/courses</code>), mục trên trang chủ (<code>#dang-ky</code>) hoặc
        địa chỉ web đầy đủ (<code>https://...</code>).
      </p>
      <a href="/" target="_blank" rel="noopener noreferrer" className="hpa-preview-link"><ExternalLink size={14} /> Xem trang chủ</a>

      <Section title="Thông tin liên hệ & mạng xã hội" desc="Hiện ở thanh trên cùng, nút gọi, form đăng ký và chân trang" open>
        <div className="hpa-grid">
          <Field label="Hotline" value={contact.hotline} onChange={set('contact', 'hotline')} placeholder="VD: 0912 345 678" hint="Nút gọi điện rung ở góc dưới màn hình." />
          <Field label="Email" value={contact.email} onChange={set('contact', 'email')} />
          <Field label="Địa chỉ" value={contact.address} onChange={set('contact', 'address')} />
          <Field label="Giờ làm việc" value={contact.hours} onChange={set('contact', 'hours')} placeholder="VD: Thứ 2 – CN: 8:00 – 21:00" />
          <Field label="Link Facebook" value={contact.facebook} onChange={set('contact', 'facebook')} placeholder="https://facebook.com/..." />
          <Field label="Link YouTube" value={contact.youtube} onChange={set('contact', 'youtube')} placeholder="https://youtube.com/..." />
          <Field label="Link TikTok" value={contact.tiktok} onChange={set('contact', 'tiktok')} placeholder="https://tiktok.com/@..." />
          <Field label="Link Zalo" value={contact.zalo} onChange={set('contact', 'zalo')} placeholder="https://zalo.me/..." hint="Nút Zalo rung ở góc dưới màn hình. Để trống sẽ tự dùng zalo.me/<Hotline>." />
        </div>
      </Section>

      <Section title="Banner đầu trang">
        <Field label="Dòng chữ thanh đỏ trên cùng" value={topbar.slogan} onChange={set('topbar', 'slogan')} />
        <div className="hpa-grid">
          <Field label="Tiêu đề lớn - dòng 1" value={hero.title1} onChange={set('hero', 'title1')} />
          <Field label="Tiêu đề lớn - dòng 2" value={hero.title2} onChange={set('hero', 'title2')} />
          <Field label="Dòng phụ dưới tiêu đề" value={hero.subtitle} onChange={set('hero', 'subtitle')} />
          <Field label="Nhãn ưu đãi (nền cam)" value={hero.promo} onChange={set('hero', 'promo')} hint="Để trống để ẩn." />
          <Field label="Dòng chữ dưới 3 chấm màu" value={hero.tagline} onChange={set('hero', 'tagline')} />
        </div>
        <ImageField label="Ảnh nền banner (để trống dùng ảnh đèn lồng mặc định)" value={hero.imageUrl} onChange={set('hero', 'imageUrl')} />
      </Section>

      <Section title="Ảnh hoạt động & 3 ô lối tắt">
        <ImageField label="Ảnh hoạt động giảng dạy (để trống dùng ảnh mặc định)" value={activity.imageUrl} onChange={set('activity', 'imageUrl')} />
        <Field label="Chú thích dưới ảnh" value={activity.caption} onChange={set('activity', 'caption')} />
        <ListEditor
          items={data.quickLinks} onChange={setList('quickLinks')} max={3}
          fields={[{ key: 'label', label: 'Chữ trên ô' }, { key: 'url', label: 'Link' }]}
          blank={{ label: '', url: '' }} itemTitle={(x) => x.label} addLabel="Thêm ô"
        />
      </Section>

      <Section title="Giới thiệu - Tại sao chọn chúng tôi">
        <Field label="Tiêu đề" value={why.title} onChange={set('why', 'title')} />
        <Field
          label="Các lý do (mỗi dòng 1 ý, tối đa 8)" textarea value={why.items.join('\n')}
          onChange={(v) => set('why', 'items')(v.split('\n'))}
        />
        <div className="hpa-grid">
          <Field label="Tên thương hiệu (thẻ bên phải)" value={why.brandName} onChange={set('why', 'brandName')} />
          <Field label="Mô tả ngắn dưới tên" value={why.brandTagline} onChange={set('why', 'brandTagline')} />
          <Field label="Chữ trên nút" value={why.buttonLabel} onChange={set('why', 'buttonLabel')} />
          <Field label="Link của nút" value={why.buttonUrl} onChange={set('why', 'buttonUrl')} />
        </div>
      </Section>

      <Section title="Khoá học" desc="Thẻ khoá học lấy tự động từ các cấp độ (khoá đang bán xếp trước, tối đa 8)">
        <Field label="Tiêu đề" value={courses.title} onChange={set('courses', 'title')} />
        <Field label="Mô tả (chữ đỏ nghiêng)" textarea value={courses.desc} onChange={set('courses', 'desc')} />
      </Section>

      <Section title={`Tin tức & bài viết (${data.news.length})`}>
        <ListEditor
          items={data.news} onChange={setList('news')} max={12}
          fields={[
            { key: 'title', label: 'Tiêu đề' }, { key: 'date', label: 'Ngày đăng', placeholder: 'VD: 01/10/2026' },
            { key: 'excerpt', label: 'Tóm tắt', textarea: true }, { key: 'link', label: 'Link bài viết', placeholder: 'https://...' },
            { key: 'imageUrl', label: 'Ảnh', image: true }
          ]}
          blank={{ title: '', date: '', excerpt: '', link: '', imageUrl: '' }} itemTitle={(x) => x.title} addLabel="Thêm bài viết"
        />
      </Section>

      <Section title={`Video học miễn phí (${data.videos.length})`} desc="Dán link YouTube, ảnh thu nhỏ lấy tự động">
        <ListEditor
          items={data.videos} onChange={setList('videos')} max={12}
          fields={[
            { key: 'youtubeUrl', label: 'Link YouTube', placeholder: 'https://www.youtube.com/watch?v=...' },
            { key: 'title', label: 'Tiêu đề' }, { key: 'desc', label: 'Mô tả ngắn' }
          ]}
          blank={{ youtubeUrl: '', title: '', desc: '' }} itemTitle={(x) => x.title} addLabel="Thêm video"
        />
      </Section>

      <Section title={`Đội ngũ giảng viên (${data.teachers.length})`}>
        <ListEditor
          items={data.teachers} onChange={setList('teachers')} max={12}
          fields={[
            { key: 'name', label: 'Họ tên' }, { key: 'title', label: 'Chức danh (chữ đỏ)' },
            { key: 'workplace', label: 'Đơn vị công tác', textarea: true }, { key: 'degree', label: 'Học vị' },
            { key: 'major', label: 'Chuyên ngành' }, { key: 'school', label: 'Đơn vị đào tạo' },
            { key: 'experience', label: 'Kinh nghiệm', placeholder: 'VD: 5 năm kinh nghiệm' },
            { key: 'imageUrl', label: 'Ảnh', image: true }
          ]}
          blank={{ name: '', title: '', workplace: '', degree: '', major: '', school: '', experience: '', imageUrl: '' }}
          itemTitle={(x) => x.name} addLabel="Thêm giảng viên"
        />
      </Section>

      <Section title={`Cảm nhận học viên (${data.testimonials.length})`} desc="Chỉ nhập cảm nhận thật của học viên">
        <ListEditor
          items={data.testimonials} onChange={setList('testimonials')} max={24}
          fields={[
            { key: 'name', label: 'Tên học viên' }, { key: 'course', label: 'Khoá đã học' },
            { key: 'content', label: 'Nội dung cảm nhận', textarea: true }, { key: 'achievement', label: 'Thành tích (dòng có cúp)' },
            { key: 'link', label: 'Link bài đánh giá gốc (Facebook...)' }, { key: 'avatarUrl', label: 'Ảnh đại diện', image: true }
          ]}
          blank={{ name: '', course: '', content: '', achievement: '', link: '', avatarUrl: '' }}
          itemTitle={(x) => x.name} addLabel="Thêm cảm nhận"
        />
      </Section>

      <Section title="Khung đăng ký tư vấn">
        <div className="hpa-grid">
          <Field label="Dòng chữ nhỏ phía trên" value={consult.eyebrow} onChange={set('consult', 'eyebrow')} />
          <Field label="Tiêu đề (chữ trắng)" value={consult.title} onChange={set('consult', 'title')} />
          <Field label="Dòng nổi bật (chữ vàng)" value={consult.highlight} onChange={set('consult', 'highlight')} />
        </div>
        <Field label="Mô tả" textarea value={consult.desc} onChange={set('consult', 'desc')} />
        <ImageField label="Ảnh nền khung đỏ (để trống dùng ảnh mái ngói mặc định)" value={consult.imageUrl} onChange={set('consult', 'imageUrl')} />
      </Section>

      <Section title="Chân trang">
        <Field label="Giới thiệu ngắn dưới logo" textarea value={footer.about} onChange={set('footer', 'about')} />
      </Section>

      <div className="hpa-savebar">
        {error && <div className="form-error">{error}</div>}
        {msg && <span className="save-ok"><Check size={15} /> {msg}</span>}
        <button type="button" className="btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </div>
    </div>
  );
}

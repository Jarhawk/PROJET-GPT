// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { supabase } from "@/lib/supabase";

export function pathFromUrl(url) {
  const match = url?.match(/\/object\/public\/[^/]+\/(.*)$/);
  return match ? match[1] : "";
}

export async function uploadFile(bucket, file, folder = "") {
  if (!file) throw new Error("No file provided");
  const ext = file.name.split(".").pop();
  const filePath = `${folder}${folder ? "/" : ""}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteFile(bucket, path) {
  if (!path) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function replaceFile(bucket, file, previous = '', folder = '') {
  const path = previous
    ? previous.includes('/')
      ? pathFromUrl(previous)
      : previous
    : '';
  if (path) {
    try {
      await deleteFile(bucket, path);
    } catch {
      // ignore deletion errors
    }
  }
  return uploadFile(bucket, file, folder);
}
export async function downloadFile(bucket, path) {
  if (!path) throw new Error('No path provided');
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return data;
}

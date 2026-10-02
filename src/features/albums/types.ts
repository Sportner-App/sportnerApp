export type ApiAlbum = {
  id: string;
  title: string;
  description: string | null;
  mediaCount: number;
  kind: number;
  visibility: number;
  createdAt: string;
};

export type ApiAlbumDetail = ApiAlbum & {
  media: Array<{
    id: string;
    storagePath: string;
    fileName: string;
    mimeType: string;
  }>;
};

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  Kategori,
  Pengajuan,
  Ruangan,
  Sarana,
  SaranaRuangan,
} from "@/types/ruangan";
import { db, storage } from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const ruanganApi = createApi({
  reducerPath: "ruanganApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Ruangan", "Kategori", "Sarana"],
  endpoints: (build) => ({
    getRuangan: build.query({
      query: () => "ruangan",
      providesTags: ["Ruangan"],
    }),
    addRuangan: build.mutation<Ruangan, Omit<Ruangan, "id">>({
      queryFn: async (arg) => {
        const docRef = await addDoc(collection(db, "ruangan"), arg);
        return { data: { ...arg, id: docRef.id } };
      },
      invalidatesTags: ["Ruangan"],
    }),
    updateRuangan: build.mutation<
      Ruangan,
      Ruangan & {
        sarana: (Omit<SaranaRuangan, "id"> & {
          id?: string;
        })[];
      }
    >({
      queryFn: async (arg) => {
        const { id, sarana, ...rest } = arg;
        const preBatch = writeBatch(db);

        // update ruangan
        const ruanganRef = doc(db, "ruangan", id);
        preBatch.update(ruanganRef, rest);

        // delete entire collection
        const ref = collection(db, "ruangan", id, "saranaRuangan");
        const saranaSnap = await getDocs(ref);

        saranaSnap.forEach((doc) => {
          preBatch.delete(doc.ref);
        });

        await preBatch.commit();

        const batch = writeBatch(db);
        // save new data
        sarana.forEach((s) => {
          batch.set(doc(ref), s);
        });

        await batch.commit();
        return { data: arg };
      },
      invalidatesTags: ["Ruangan"],
    }),
    deleteRuangan: build.mutation<string, string>({
      queryFn: async (id) => {
        await deleteDoc(doc(db, "ruangan", id));
        return { data: "success" };
      },
      invalidatesTags: ["Ruangan"],
    }),
    addKategori: build.mutation<Kategori, Omit<Kategori, "id">>({
      queryFn: async (arg) => {
        const docRef = await addDoc(collection(db, "kategori"), arg);
        return { data: { ...arg, id: docRef.id } };
      },
      invalidatesTags: ["Kategori"],
    }),
    updateKategori: build.mutation<Kategori, Kategori>({
      queryFn: async (arg) => {
        const { id, ...rest } = arg;
        await updateDoc(doc(db, "kategori", id), rest);
        return { data: arg };
      },
      invalidatesTags: ["Kategori"],
    }),
    deleteKategori: build.mutation<string, string>({
      queryFn: async (id) => {
        await deleteDoc(doc(db, "kategori", id));
        return { data: "success" };
      },
      invalidatesTags: ["Kategori"],
    }),
    uploadImages: build.mutation<
      Ruangan["images"],
      {
        id: string;
        images: File[];
      }
    >({
      queryFn: async ({ images, id }) => {
        const promises = images.map((image) => {
          const storageRef = ref(storage, `images/${image.name}`);
          return uploadBytes(storageRef, image);
        });

        const res = await Promise.all(promises);
        const downloadURLs = await Promise.all(
          res.map((snapshot) => getDownloadURL(snapshot.ref))
        );

        // update ruangan
        const ruanganRef = doc(db, "ruangan", id);
        await updateDoc(ruanganRef, {
          images: downloadURLs.map((url, i) => ({
            name: images[i].name,
            url,
          })),
        });

        return {
          data: downloadURLs.map((url, i) => ({ name: images[i].name, url })),
        };
      },
    }),
    addSarana: build.mutation<Sarana, Omit<Sarana, "id">>({
      queryFn: async (arg) => {
        const docRef = await addDoc(collection(db, "sarana"), arg);
        return { data: { ...arg, id: docRef.id } };
      },
      invalidatesTags: ["Sarana"],
    }),
    updateSarana: build.mutation<Sarana, Sarana>({
      queryFn: async (arg) => {
        const { id, ...rest } = arg;
        await updateDoc(doc(db, "sarana", id), rest);
        return { data: arg };
      },
      invalidatesTags: ["Sarana"],
    }),
    deleteSarana: build.mutation<string, string>({
      queryFn: async (id) => {
        await deleteDoc(doc(db, "sarana", id));
        return { data: "success" };
      },
      invalidatesTags: ["Sarana"],
    }),
    addPengajuan: build.mutation<string, Omit<Pengajuan, "id">>({
      queryFn: async (arg) => {
        await addDoc(collection(db, "pengajuan"), arg);
        return { data: "success" };
      },
    }),
    cancelPengajuan: build.mutation<string, string>({
      queryFn: async (id) => {
        await updateDoc(doc(db, "pengajuan", id), {
          status: "canceled",
        });
        return { data: "success" };
      },
    }),
    deletePengajuan: build.mutation<string, string>({
      queryFn: async (id) => {
        await deleteDoc(doc(db, "pengajuan", id));
        return { data: "success" };
      },
    }),
    approvePengajuan: build.mutation<string, Pengajuan>({
      queryFn: async (data) => {
        const { id, ...rest } = data;

        const batch = writeBatch(db);

        // update pengajuan
        batch.update(doc(db, "pengajuan", id), {
          status: "approved",
        });

        // add saranaRuangan
        addDoc(collection(db, "ruangan", id, "saranaRuangan"), {
          ruanganId: rest.ruanganId,
          saranaId: rest.saranaId,
          quantity: rest.quantity,
          condition: "good",
        });

        await batch.commit();

        return { data: "success" };
      },
    }),
    rejectPengajuan: build.mutation<string, string>({
      queryFn: async (id) => {
        await updateDoc(doc(db, "pengajuan", id), {
          status: "rejected",
        });
        return { data: "success" };
      },
    }),
  }),
});

export const {
  useGetRuanganQuery,
  useAddRuanganMutation,
  useAddKategoriMutation,
  useUpdateKategoriMutation,
  useUpdateRuanganMutation,
  useDeleteRuanganMutation,
  useDeleteKategoriMutation,
  useUploadImagesMutation,
  useAddSaranaMutation,
  useUpdateSaranaMutation,
  useDeleteSaranaMutation,
  useAddPengajuanMutation,
  useCancelPengajuanMutation,
  useDeletePengajuanMutation,
  useApprovePengajuanMutation,
  useRejectPengajuanMutation,
} = ruanganApi;

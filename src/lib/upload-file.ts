import { uploadBytesResumable, getDownloadURL, ref } from "firebase/storage";
import { storage } from "./fire-base";

export const uploadCV = async (
  buffer: any,
  fileName: string,
  cv: boolean,
  type: string
) => {
  const fileRef = ref(
    storage,
    `job-search-app/${cv ? "/cv" : "/files"}/${fileName}`
  );

  const metadata = {
    contentType: type,
  };

  try {
    const snapShot = await uploadBytesResumable(
      fileRef,
      buffer,
      metadata as any
    );

    const downloadURL = await getDownloadURL(snapShot.ref);

    return { success: "File uploaded", url: downloadURL };
  } catch (err) {
    console.log("Error", err);
    return { error: "Error uploading file" };
  }
};

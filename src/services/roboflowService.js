import axios from "axios";

import {
  ROBOFLOW_API_KEY,
  ROBOFLOW_MODEL,
  ROBOFLOW_VERSION,
} from "src/config/roboflow";

const MODEL_ID_VERSION = `${ROBOFLOW_MODEL}/${ROBOFLOW_VERSION}`;

const roboflowService = {
  detectIngredients: async (imageFile) => {
    try {
      const imageBase64 = await toBase64(imageFile);
      const response = await axios({
        method: "POST",
        url: `https://detect.roboflow.com/${MODEL_ID_VERSION}`,
        params: {
          api_key: ROBOFLOW_API_KEY,
        },
        data: imageBase64,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error detecting ingredients:", error);
      throw error;
    }
  },
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });

export default roboflowService;

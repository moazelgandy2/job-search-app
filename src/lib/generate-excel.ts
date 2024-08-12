import { ApplicationModel } from "../../db/models/application-model";
import XLSX from "xlsx";
import { uploadCV } from "./upload-file";

export async function generateCompanyApplicationsExcel(
  companyId: any,
  date: any
) {
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const applications = await ApplicationModel.find({
      job: { $exists: true },
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate({
        path: "job",
        select:
          "title location workingTime level description techSkills softSkills",
        match: { company: companyId },
      })
      .populate({
        path: "userId",
        select: "firstName lastName email phoneNumber DOB role",
      })
      .lean();

    const filteredApplications = applications.filter((app) => app.job !== null);

    if (filteredApplications.length === 0) {
      console.log("No applications found for the specified date and company!");
      return {
        empty: "No applications found for the specified date and company!",
      };
    }

    const data = filteredApplications.map((application) => {
      delete (application.job as any)._id;

      return {
        ...application.job,
        techSkills: (application.job as any).techSkills.join(", "),
        softSkills: (application.job as any).softSkills.join(", "),
        ...application.userId,
        UserResume: application.userResume,
        ApplicationDate: application.createdAt.toISOString().split("T")[0],
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applications");

    const fileName = `Applications_${companyId}_${date}.xlsx`;
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const res = await uploadCV(
      excelBuffer,
      fileName,
      false,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    if (res.error) {
      console.log("Error uploading Excel file to Firebase");
      return { error: "Error uploading Excel file to Firebase" };
    }

    return { success: "Excel file uploaded", url: res.url };
  } catch (err) {
    console.error("Error generating Excel file:", err);
  }
}

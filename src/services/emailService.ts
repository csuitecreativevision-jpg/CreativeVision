import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'creativevision_applicant';
const EMAILJS_TEMPLATE_ID = 'template_o9xmrcv';
const EMAILJS_PUBLIC_KEY = '4Cp-JCL95gmOz8Ux2';

export interface FormData {
  fullName: string;
  email: string;
  hasExperience: string;
  contentType: string;
  successfulVideo: string;
  comfortableVideoTypes: string;
  editingProcess: string;
  engagementTechnique: string;
  successMeasurement: string;
  motionGraphicsExperience: string;
  stayUpdated: string;
  toolsSoftware: string;
  whyJoin: string;
  portfolioLink: string;
  specialization?: string;
}

export const sendApplicationEmail = async (formData: FormData & { specialization: string }) => {
  try {
    const templateParams = {
      to_name: 'Creative Vision Team',
      from_name: formData.fullName,
      from_email: formData.email,
      specialization: formData.specialization,
      has_experience: formData.hasExperience,
      content_type: formData.contentType,
      successful_video: formData.successfulVideo,
      comfortable_video_types: formData.comfortableVideoTypes,
      editing_process: formData.editingProcess,
      engagement_technique: formData.engagementTechnique,
      success_measurement: formData.successMeasurement,
      motion_graphics_experience: formData.motionGraphicsExperience,
      stay_updated: formData.stayUpdated,
      tools_software: formData.toolsSoftware,
      why_join: formData.whyJoin,
      portfolio_link: formData.portfolioLink,
      message: `New application received from ${formData.fullName} for ${formData.specialization} position.`
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    return { success: true, response };
  } catch (error) {
    console.error('EmailJS Error:', error);
    return { success: false, error };
  }
};

// Initialize EmailJS (call this once in your app)
export const initEmailJS = () => {
  emailjs.init(EMAILJS_PUBLIC_KEY);
};
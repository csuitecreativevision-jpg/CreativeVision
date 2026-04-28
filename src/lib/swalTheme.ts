import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

const CV_SWAL_BASE: SweetAlertOptions = {
    background: '#131322',
    color: '#f4f4f5',
    confirmButtonColor: '#7c3aed',
    cancelButtonColor: '#4c1d95',
    heightAuto: false,
    scrollbarPadding: false,
    buttonsStyling: false,
    customClass: {
        popup: 'rounded-2xl border border-white/10 shadow-2xl',
        title: '!text-white !font-bold !tracking-tight',
        htmlContainer: '!text-white/80',
        actions: '!gap-2',
        confirmButton:
            '!rounded-xl !px-5 !py-2.5 !font-semibold !text-white !bg-violet-600 hover:!bg-violet-500 focus:!outline-none',
        cancelButton:
            '!rounded-xl !px-5 !py-2.5 !font-semibold !text-white !bg-violet-900/80 hover:!bg-violet-800 focus:!outline-none',
    },
};

export function fireCvSwal(options: SweetAlertOptions): Promise<SweetAlertResult<any>> {
    return Swal.fire({
        ...CV_SWAL_BASE,
        ...options,
        customClass: {
            ...(CV_SWAL_BASE.customClass || {}),
            ...(options.customClass || {}),
        },
    });
}


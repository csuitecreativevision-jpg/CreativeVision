import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

const isDarkMode = () => localStorage.getItem('portal_ui_dark_mode') !== 'false';

const getCvSwalBase = (): SweetAlertOptions => {
    const dark = isDarkMode();
    return {
        background: dark ? '#0c0c10' : '#ffffff',
        color: dark ? '#f4f4f5' : '#18181b',
        confirmButtonColor: '#7c3aed',
        cancelButtonColor: dark ? '#4c1d95' : '#e4e4e7',
        backdrop: dark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)',
        heightAuto: false,
        scrollbarPadding: false,
        buttonsStyling: false,
        customClass: {
            popup: dark
                ? 'rounded-2xl border border-white/[0.1] shadow-2xl !w-[min(90vw,28rem)] !p-0'
                : 'rounded-2xl border border-zinc-300 shadow-2xl !w-[min(90vw,28rem)] !p-0',
            title: dark
                ? '!text-white !font-bold !tracking-tight !text-[1.2rem] !leading-tight !px-5 !pt-5 !pb-2'
                : '!text-zinc-900 !font-bold !tracking-tight !text-[1.2rem] !leading-tight !px-5 !pt-5 !pb-2',
            htmlContainer: dark ? '!text-white/80 !text-[0.9rem] !leading-relaxed !px-5 !pb-2 !m-0' : '!text-zinc-700 !text-[0.9rem] !leading-relaxed !px-5 !pb-2 !m-0',
            input: dark
                ? '!rounded-xl !border !border-white/[0.14] !bg-[#0d1020] !text-white !text-[0.9rem] !px-4 !py-2.5 !mx-5 !w-[calc(100%-2.5rem)] focus:!border-violet-500/60'
                : '!rounded-xl !border !border-zinc-300 !bg-white !text-zinc-900 !text-[0.9rem] !px-4 !py-2.5 !mx-5 !w-[calc(100%-2.5rem)] focus:!border-violet-500',
            validationMessage: dark
                ? '!bg-red-500/15 !text-red-200 !rounded-lg !px-3 !py-2 !mt-2'
                : '!bg-red-50 !text-red-700 !rounded-lg !px-3 !py-2 !mt-2',
            actions: '!gap-2 !px-5 !pb-5 !pt-2 !mt-0',
            confirmButton:
                '!rounded-xl !px-4 !py-2.5 !text-[0.9rem] !font-semibold !text-white !bg-violet-600 hover:!bg-violet-500 focus:!outline-none',
            cancelButton: dark
                ? '!rounded-xl !px-4 !py-2.5 !text-[0.9rem] !font-semibold !text-white !bg-violet-900/80 hover:!bg-violet-800 focus:!outline-none'
                : '!rounded-xl !px-4 !py-2.5 !text-[0.9rem] !font-semibold !text-zinc-700 !bg-zinc-200 hover:!bg-zinc-300 focus:!outline-none',
        },
    };
};

export function fireCvSwal(options: SweetAlertOptions): Promise<SweetAlertResult<any>> {
    const CV_SWAL_BASE = getCvSwalBase();
    return Swal.fire({
        ...CV_SWAL_BASE,
        ...options,
        customClass: {
            ...(CV_SWAL_BASE.customClass || {}),
            ...(options.customClass || {}),
        },
    });
}


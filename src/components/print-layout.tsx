"use client";

import { useLanguage } from "@/components/language-provider";

export function PrintHeader({ title, generatedAt }: { title: string; generatedAt?: string }) {
  const { language } = useLanguage();
  return (
    <div className="print-only mb-8 border-b-2 border-black pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight">SIMPAIE</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
            {language === 'ar' ? 'الخبير القانوني الرقمي' : 'Le Jurisconsulte Digital'}
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="font-bold">{title}</p>
          <p className="opacity-70">
            {language === 'ar' ? 'تاريخ الاستخراج' : 'Généré le'}: {generatedAt || new Date().toLocaleString()}
          </p>
          <p className="opacity-70">Source: SIMPAIE</p>
        </div>
      </div>
    </div>
  );
}

export function PrintFooter() {
  const { language } = useLanguage();
  return (
    <footer className="print-only mt-12 border-t pt-8 text-[10px] text-gray-500">
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="font-bold uppercase mb-2">
            {language === 'ar' ? 'توقيع المشغل' : "Signature de l'Employeur"}
          </p>
          <div className="h-24 border border-dashed border-gray-300 rounded"></div>
        </div>
        <div>
          <p className="font-bold uppercase mb-2">
            {language === 'ar' ? 'توقيع الأجير' : 'Signature du Salarié'}
          </p>
          <div className="h-24 border border-dashed border-gray-300 rounded"></div>
        </div>
      </div>
      <p className="mb-2 italic">
        {language === 'ar' 
          ? 'تنبيه: هذه الوثيقة عبارة عن محاكاة بناءً على البيانات المدخلة. لا تشكل كشف راتب رسمي أو قرارًا قانونيًا نهائيًا.'
          : 'Avertissement: Ce document est une simulation basée sur les données saisies par l\'utilisateur. Il ne constitue pas un bulletin de paie officiel ni une décision juridique définitive.'
        }
      </p>
      <p>
        {language === 'ar'
          ? 'تم استخراج هذه الوثيقة عبر منصة SIMPAIE. متوافقة مع مقتضيات مدونة الشغل (القانون 65-99).'
          : 'Document généré par la plateforme SIMPAIE. Conforme aux dispositions du Code du Travail (Loi 65-99).'
        }
      </p>
    </footer>
  );
}

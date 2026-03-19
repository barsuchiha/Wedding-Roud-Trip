import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarHeart, MapPin, Gift, Clock, Navigation, ChevronDown, ExternalLink, Sparkles, CalendarPlus } from "lucide-react";

import { RsvpSmartCaptcha } from "@/components/rsvp-smart-captcha";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ApiRequestError, apiRequest } from "@/lib/queryClient";
import { insertRsvpSchema, type DrinkOptionId, type InsertRsvp, type RsvpSubmission } from "@shared/rsvp";

// @ts-ignore
import heroBg from '@/assets/images/hero-bg.png';
// @ts-ignore
import dinnerImg from '@/assets/images/dinner.png';
// @ts-ignore
import vinylImg from '@/assets/images/vinyl.png';
// @ts-ignore
import venueImg from '@/assets/images/venue.png';
// @ts-ignore
import dressLookWomanJumpsuit from '@/assets/images/dresscode/look-woman-jumpsuit.jpeg';
// @ts-ignore
import dressLookWomanDenimDress from '@/assets/images/dresscode/look-woman-denim-dress.jpeg';
// @ts-ignore
import dressLookWomanRedSkirt from '@/assets/images/dresscode/look-woman-red-skirt.jpeg';
// @ts-ignore
import dressLookWomanPinkJacket from '@/assets/images/dresscode/look-woman-pink-jacket.jpeg';
// @ts-ignore
import dressLookManBoots from '@/assets/images/dresscode/look-man-boots.jpeg';
// @ts-ignore
import dressLookManFloralSuit from '@/assets/images/dresscode/look-man-floral-suit.jpeg';
// @ts-ignore
import dressLookManTailoring from '@/assets/images/dresscode/look-man-tailoring.jpeg';
// @ts-ignore
import dressLookManStripedVest from '@/assets/images/dresscode/look-man-striped-vest.jpeg';

const formSchema = insertRsvpSchema;

const drinkOptions: Array<{ id: DrinkOptionId; label: string }> = [
  { id: "beer", label: "Пиво" },
  { id: "white_wine", label: "Вино белое" },
  { id: "red_wine", label: "Вино красное" },
  { id: "sparkling", label: "Игристое" },
  { id: "non_alcoholic", label: "Безалкогольное" }
];

function toggleDrinkSelection(
  selectedDrinks: DrinkOptionId[] | undefined,
  drinkId: DrinkOptionId,
  checked?: boolean,
) {
  const nextDrinks = selectedDrinks ?? [];

  if (checked === true) {
    return nextDrinks.includes(drinkId)
      ? nextDrinks
      : [...nextDrinks, drinkId];
  }

  if (checked === false) {
    return nextDrinks.filter((value) => value !== drinkId);
  }

  return nextDrinks.includes(drinkId)
    ? nextDrinks.filter((value) => value !== drinkId)
    : [...nextDrinks, drinkId];
}

const chekhovApiSiteUrl = "https://chekhovapi.com";
const chekhovApiMapOrgUrl =
  "https://yandex.com/maps/org/chekhov_api/1684192929/?utm_medium=mapframe&utm_source=maps";
const chekhovApiMapCategoryUrl =
  "https://yandex.com/maps/1/moscow-and-moscow-oblast/category/hotel/184106414/?utm_medium=mapframe&utm_source=maps";
const chekhovApiMapWidgetSrc =
  "https://yandex.com/map-widget/v1/?ll=37.284648%2C55.149105&mode=search&oid=1684192929&ol=biz&sctx=ZAAAAAgBEAAaKAoSCXoAi%2Fz6kRNAET49tmXAL0pAEhIJVpkprb8l%2Bj8RmrSpukc25z8iBgABAgMEBSgKOABA9K4GSAFiOnJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9FbmFibGVkPTFiOnJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9NYXhhZHY9MTViRHJlYXJyPXNjaGVtZV9Mb2NhbC9HZW91cHBlci9BZHZlcnRzL0N1c3RvbU1heGFkdi9SZWdpb25JZHM9WzEsMTAxNzRdYkByZWFycj1zY2hlbWVfTG9jYWwvR2VvdXBwZXIvQWR2ZXJ0cy9NYXhhZHZUb3BNaXgvTWF4YWR2Rm9yTWl4PTEwagJydZ0BzczMPaABAKgBAL0BURKihcIBBaH9iqMGggIR0YfQtdGF0L7QsiDQsNC%2F0LiKAgCSAgUxMDc2MZoCDGRlc2t0b3AtbWFwcw%3D%3D&sll=37.284648%2C55.149105&sspn=0.817108%2C0.339369&text=%D1%87%D0%B5%D1%85%D0%BE%D0%B2%20%D0%B0%D0%BF%D0%B8&z=11";
const weddingCalendarFileUrl = "/wedding-road-trip.ics";
const smartCaptchaSiteKey =
  import.meta.env.VITE_YANDEX_SMARTCAPTCHA_SITE_KEY?.trim() ?? "";

const dressCodeMoodPoints = [
  "Яркие цвета и выгоревшие оттенки",
  "Винтажные находки и вещи с историей",
  "Интересные фактуры: лен, шелк, деним, замша",
  "Слои, свобода и небанальные сочетания",
];

const dressCodeShoePoints = [
  "Устойчивый каблук или платформа",
  "Сандалии, мюли, кроссовки, ботинки",
  "Винтажные сапоги, если захочется быть драматичными",
];

const dressCodeClothingPoints = [
  "Учитывайте длину: слишком длинные брюки или платья будут собирать пыль и траву",
  "Выбирайте вещи, в которых можно сидеть, ходить и танцевать, а не только красиво стоять",
];

const dressCodeLookbook = [
  {
    src: dressLookWomanJumpsuit,
    alt: "Референс дресс-кода: зеленый винтажный комплект",
    label: "Принт и выгоревшие оттенки",
  },
  {
    src: dressLookWomanDenimDress,
    alt: "Референс дресс-кода: джинсовое платье и казаки",
    label: "Деним и драматичная обувь",
  },
  {
    src: dressLookWomanRedSkirt,
    alt: "Референс дресс-кода: красная юбка и блестящий топ",
    label: "Еще больше драмы",
  },
  {
    src: dressLookWomanPinkJacket,
    alt: "Референс дресс-кода: платье и яркая шуба",
    label: "Фактура и цвет",
  },
  {
    src: dressLookManBoots,
    alt: "Референс дресс-кода: свободный мужской образ с джинсами",
    label: "Свободный силуэт",
  },
  {
    src: dressLookManFloralSuit,
    alt: "Референс дресс-кода: костюм с цветочным узором",
    label: "Костюм с характером",
  },
  {
    src: dressLookManTailoring,
    alt: "Референс дресс-кода: мягкий tailoring",
    label: "Мягкие силуэты",
  },
  {
    src: dressLookManStripedVest,
    alt: "Референс дресс-кода: тельняшка, жилет и patched denim",
    label: "Слои и ирония",
  },
];

export default function Home() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaErrorMessage, setCaptchaErrorMessage] = useState<string | null>(null);
  const [captchaInstanceKey, setCaptchaInstanceKey] = useState(0);
  const isSmartCaptchaEnabled = Boolean(smartCaptchaSiteKey);

  const form = useForm<InsertRsvp>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      telegram: "",
      phone: "",
      drinks: [],
    },
  });

  const reloadCaptcha = (message?: string) => {
    setCaptchaToken("");
    setCaptchaErrorMessage(message ?? null);
    setCaptchaInstanceKey((currentKey) => currentKey + 1);
  };

  async function onSubmit(values: InsertRsvp) {
    if (isSmartCaptchaEnabled && !captchaToken) {
      const message = "Подтвердите, что вы не робот.";
      setCaptchaErrorMessage(message);
      toast({
        title: "Подтвердите отправку",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setCaptchaErrorMessage(null);

    try {
      const payload: RsvpSubmission = {
        ...values,
        captchaToken: captchaToken || undefined,
      };

      await apiRequest("POST", "/api/rsvps", payload);
      toast({
        title: "Спасибо, ждем вас!",
        description: "Ваш ответ успешно отправлен.",
      });
      form.reset();
      reloadCaptcha();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.field === "telegram") {
          form.setError("telegram", {
            type: "server",
            message: error.message,
          });
        }

        if (error.field === "captcha") {
          reloadCaptcha(error.message);
        }
      }

      toast({
        title: "Не удалось отправить ответ",
        description:
          error instanceof ApiRequestError || error instanceof Error
            ? error.message
            : "Попробуйте отправить форму еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-serif text-xl text-primary font-medium tracking-wide">О & О</span>
          <div className="hidden md:flex gap-6 text-sm uppercase tracking-widest text-muted-foreground">
            <button onClick={() => scrollTo('concept')} className="hover:text-primary transition-colors">Концепция</button>
            <button onClick={() => scrollTo('program')} className="hover:text-primary transition-colors">Программа</button>
            <button onClick={() => scrollTo('dresscode')} className="hover:text-primary transition-colors">Дресс-код</button>
            <button onClick={() => scrollTo('rsvp')} className="hover:text-primary transition-colors">RSVP</button>
          </div>
          <Button onClick={() => scrollTo('rsvp')} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-serif text-lg h-10 px-6 rounded-full">
            Присутствовать
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/30 z-10" />
          <img src={heroBg} alt="Свадебный роуд-трип" className="w-full h-full object-cover" />
        </div>
        
        <div className="relative z-20 text-center text-white px-4 flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <p className="text-sm md:text-lg uppercase tracking-[0.3em] mb-4 font-light">Оля и Олег</p>
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif mb-6 leading-tight drop-shadow-lg">
            Свадебный <br/> 
            <span className="text-accent">Роуд-Трип</span>
          </h1>
          <p className="text-lg md:text-2xl font-light tracking-wide mt-4">1–2 августа</p>
        </div>

        <button 
          onClick={() => scrollTo('concept')}
          className="absolute bottom-10 z-20 text-white animate-bounce p-4 rounded-full border border-white/30 backdrop-blur-sm hover:bg-white/10 transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      {/* Concept Section */}
      <section id="concept" className="py-24 md:py-32 px-4 bg-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute -inset-4 bg-secondary/10 rounded-t-full rounded-b-full transform -rotate-6 z-0"></div>
              <img src={dinnerImg} alt="Ужин под открытым небом" className="relative z-10 rounded-t-full rounded-b-full w-full object-cover aspect-[3/4] shadow-xl" />
            </div>
            <div className="order-1 md:order-2 space-y-8 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-serif text-foreground">
                Праздник <span className="text-primary">любви</span>
              </h2>
              <div className="w-16 h-px bg-primary mx-auto md:mx-0"></div>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
                Что может быть лучше, чем совместное путешествие и летний роуд-трип? Финальная точка — наша свадьба: здесь повсюду раскинулись ковры, стол под открытым небом и вечер, полный новых романтичных впечатлений. Приглашаем вас отпраздновать любовь.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Section */}
      <section id="program" className="py-24 md:py-32 px-4 bg-card">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-serif text-foreground mb-4">Программа уикенда</h2>
            <p className="text-muted-foreground tracking-widest uppercase text-sm">Расписание нашего путешествия</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Saturday */}
            <div className="bg-background p-8 md:p-12 rounded-2xl shadow-sm border border-border/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
              <h3 className="text-2xl font-serif text-primary mb-8 flex items-center gap-3">
                <CalendarHeart className="w-6 h-6" />
                Суббота, 1 августа
              </h3>
              
              <ul className="space-y-6 relative z-10">
                <li className="flex gap-4">
                  <span className="text-muted-foreground font-mono text-sm pt-1 w-28 shrink-0">15:00-16:00</span>
                  <span className="text-foreground">Заселение</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-muted-foreground font-mono text-sm pt-1 w-28 shrink-0">16:00-16:30</span>
                  <span className="text-foreground">Сбор гостей на петанк</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-primary font-mono text-sm pt-1 w-28 shrink-0 font-bold">16:30-17:00</span>
                  <span className="text-foreground font-medium">Церемония</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-muted-foreground font-mono text-sm pt-1 w-28 shrink-0">17:00-17:30</span>
                  <span className="text-foreground">Начало мероприятия</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-muted-foreground font-mono text-sm pt-1 w-28 shrink-0">22:30-23:00</span>
                  <span className="text-foreground">Окончание официальной программы</span>
                </li>
              </ul>
            </div>

            {/* Sunday */}
            <div className="bg-background p-8 md:p-12 rounded-2xl shadow-sm border border-border/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
              <h3 className="text-2xl font-serif text-primary mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6" />
                Воскресенье, 2 августа
              </h3>
              
              <ul className="space-y-6 relative z-10">
                <li className="flex gap-4">
                  <span className="text-muted-foreground font-mono text-sm pt-1 w-28 shrink-0">09:00-11:30</span>
                  <span className="text-foreground">Ленивый долгий завтрак</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-muted-foreground font-mono text-sm pt-1 w-28 shrink-0">12:00</span>
                  <span className="text-foreground">Выселение и отправление домой</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dress Code & Gifts */}
      <section id="dresscode" className="py-24 md:py-32 px-4 bg-background border-y border-border/50">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24">
            
            {/* Dress Code */}
            <div className="flex h-full flex-col gap-6">
              <div className="inline-block px-4 py-1 border border-primary/30 rounded-full text-primary text-sm uppercase tracking-widest mb-2">Дресс-код</div>
              <h2 className="text-3xl md:text-4xl font-serif">Яркий винтаж</h2>
              <p className="text-muted-foreground leading-relaxed text-lg font-light">
                Просим воздержаться от белого и черного, а вам достается все самое яркое: одевайтесь так, будто вы прошвырнулись по самым классным винтажкам и не терпится показать новые приобретения.
              </p>
              
              <div className="flex gap-3 pt-4">
                <div className="w-12 h-12 rounded-full bg-[#E88C7D] shadow-inner"></div>
                <div className="w-12 h-12 rounded-full bg-[#E5C158] shadow-inner"></div>
                <div className="w-12 h-12 rounded-full bg-[#7CA181] shadow-inner"></div>
                <div className="w-12 h-12 rounded-full bg-[#5D7E99] shadow-inner"></div>
                <div className="w-12 h-12 rounded-full bg-[#B26B74] shadow-inner"></div>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-auto w-fit rounded-full border-primary text-primary hover:bg-primary hover:text-white">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Подробнее
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[92vh] max-w-5xl overflow-hidden border-none bg-background p-0">
                  <div className="max-h-[92vh] overflow-y-auto">
                    <DialogHeader className="border-b border-border/50 bg-card px-6 py-6 text-left md:px-8">
                      <div className="inline-flex w-fit rounded-full border border-primary/30 px-4 py-1 text-xs uppercase tracking-[0.25em] text-primary">
                        Дресс-код
                      </div>
                      <DialogTitle className="pt-3 font-serif text-3xl text-foreground md:text-4xl">
                        Яркий винтаж для летнего уикенда
                      </DialogTitle>
                      <DialogDescription className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                        Ниже собрали настроение, практические подсказки и референсы, чтобы было проще поймать общий вайб, а не собирать слишком формальный свадебный образ.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 px-6 py-6 md:px-8 md:py-8">
                      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
                          <p>
                            Нам хочется, чтобы этот уикенд ощущался живым, теплым и очень человеческим — как будто все красивые люди на пару дней сбежали из города, а в финале случилась свадьба.
                          </p>
                          <p>
                            Одевайтесь так, будто вы заехали в лучшие винтажные магазины по дороге и не смогли остановиться. Просим воздержаться от белого и черного — оставим эти цвета для более предсказуемых событий.
                          </p>
                          <p>
                            Хочется видеть характер, а не образ на глянцевую свадьбу из Pinterest. Представьте, что вы собирались на красивый летний уикенд, взяли с собой любимые вещи — и в какой-то момент оказались на свадьбе.
                          </p>
                        </div>

                        <div className="rounded-[2rem] border border-primary/15 bg-card p-6 shadow-sm">
                          <h3 className="font-serif text-2xl text-foreground">Настроение и стиль</h3>
                          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/85">
                            {dressCodeMoodPoints.map((point) => (
                              <li key={point} className="flex items-start gap-3">
                                <span className="mt-1 inline-flex min-w-8 justify-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest text-primary">
                                  Да
                                </span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="rounded-[2rem] border border-border/60 bg-card px-5 py-5 text-sm leading-relaxed text-foreground/85 md:px-6">
                        <span className="font-serif text-xl text-foreground">Важный момент</span>
                        <p className="mt-3">
                          Локация — открытое пространство. Да, будут дорожки и ковры, но они не покрывают все. Вам, скорее всего, придется ходить по траве, стоять на земле и перемещаться между зонами вне твердого покрытия.
                        </p>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-[2rem] border border-border/60 bg-background p-6 shadow-sm">
                          <h3 className="font-serif text-2xl text-foreground">Обувь</h3>
                          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                            {dressCodeShoePoints.map((point) => (
                              <li key={point} className="flex gap-3">
                                <span className="mt-2 h-2 w-2 rounded-full bg-primary"></span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                            Тонкие шпильки, капризные туфли и все, что требует идеального пола, лучше оставить дома.
                          </p>
                        </div>

                        <div className="rounded-[2rem] border border-border/60 bg-background p-6 shadow-sm">
                          <h3 className="font-serif text-2xl text-foreground">Одежда</h3>
                          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                            {dressCodeClothingPoints.map((point) => (
                              <li key={point} className="flex gap-3">
                                <span className="mt-2 h-2 w-2 rounded-full bg-primary"></span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="max-w-2xl">
                          <h3 className="font-serif text-2xl text-foreground">Референсы</h3>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Не нужно повторять образ один в один. Важнее поймать настроение: свободу, цвет, фактуру и ощущение, что вы приехали на красивый летний фестиваль.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                          {dressCodeLookbook.map((look) => (
                            <figure key={look.alt} className="group overflow-hidden rounded-[1.75rem] border border-border/60 bg-card">
                              <div className="aspect-[3/4] overflow-hidden">
                                <img
                                  src={look.src}
                                  alt={look.alt}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                              </div>
                              <figcaption className="px-4 py-3 text-sm text-foreground/85">
                                {look.label}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Gifts */}
            <div className="flex h-full flex-col gap-6">
              <div className="inline-block px-4 py-1 border border-primary/30 rounded-full text-primary text-sm uppercase tracking-widest mb-2">Подарки</div>
              <h2 className="text-3xl md:text-4xl font-serif">Вклад в планы</h2>
              <p className="text-muted-foreground leading-relaxed text-lg font-light">
                Нам будет приятно, если вы поздравите нас денежным вкладом в наши совместные планы или выберите что-то из вишлиста. А вместо цветов мы были бы очень рады виниловой пластинке в нашу коллекцию (пластинки будут в вишлисте).
              </p>
              
              <div className="mt-auto flex items-center gap-4 pt-4">
                <img src={vinylImg} alt="Винил" className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-md spin-slow" style={{ animation: 'spin 10s linear infinite' }} />
                <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full">
                  <a href="https://ohmywishes.com/users/o2wedding" target="_blank" rel="noreferrer">
                    <Gift className="w-4 h-4 mr-2" />
                    Открыть вишлист
                  </a>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Venue */}
      <section id="venue" className="py-24 md:py-32 px-4 bg-card overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-background rounded-3xl overflow-hidden shadow-lg flex flex-col md:flex-row">
            <div className="md:w-1/2">
              <img src={venueImg} alt="Отель Чехов Api" className="w-full h-full object-cover min-h-[300px]" />
            </div>
            <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-serif mb-6 text-foreground">Место проведения</h2>
              <p className="text-muted-foreground mb-8 text-lg font-light leading-relaxed">
                Приглашаем вас в загородный отель <a href={chekhovApiSiteUrl} target="_blank" rel="noreferrer" className="text-foreground font-medium underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary">Чехов Api</a> — проживание и питание оплачено с 1 по 2 августа.
              </p>

              <a
                href={chekhovApiSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-8 inline-flex w-fit items-center gap-2 text-sm uppercase tracking-[0.2em] text-primary transition-colors hover:text-foreground"
              >
                Сайт отеля
                <ExternalLink className="h-4 w-4" />
              </a>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-foreground">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Заселение с 15:00, выселение в 12:00</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapDialogOpen(true)}
                  className="flex items-center gap-3 text-left text-foreground transition-colors hover:text-primary"
                >
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Московская область, Чехов Api</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-fit rounded-full bg-secondary hover:bg-secondary/90 text-white">
                      <Navigation className="w-4 h-4 mr-2" />
                      Как добраться
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
                    <DialogHeader className="px-6 pb-0 pt-6">
                      <DialogTitle className="text-2xl md:text-3xl">Как добраться до Чехов Api</DialogTitle>
                      <DialogDescription>
                        Маршрут и расположение гостиницы на карте. Сайт отеля доступен по ссылке{" "}
                        <a
                          href={chekhovApiSiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline underline-offset-4"
                        >
                          chekhovapi.com
                        </a>
                        .
                      </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 pb-6 pt-4">
                      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
                        <a
                          href={chekhovApiMapOrgUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute left-3 top-3 z-10 text-xs text-white/85 underline underline-offset-2"
                        >
                          Чехов Api
                        </a>
                        <a
                          href={chekhovApiMapCategoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute left-3 top-8 z-10 text-xs text-white/75 underline underline-offset-2"
                        >
                          Гостиница в Москве и Московской области
                        </a>
                        <iframe
                          title="Карта Чехов Api"
                          src={chekhovApiMapWidgetSrc}
                          width="100%"
                          height="420"
                          frameBorder="1"
                          allowFullScreen
                          loading="lazy"
                          className="relative block w-full"
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button asChild variant="outline" className="w-fit rounded-full border-primary text-primary hover:bg-primary hover:text-white">
                  <a href={weddingCalendarFileUrl} download="o2-wedding-road-trip.ics">
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Добавить в календарь
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section id="rsvp" className="py-24 md:py-32 px-4 bg-background relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
             <h2 className="text-4xl md:text-6xl font-serif mb-4 text-foreground">Мы вас очень ждём</h2>
             <p className="text-xl text-muted-foreground font-light mb-4">Пожалуйста, подтвердите присутствие</p>
             <div className="inline-block bg-primary text-white px-6 py-2 rounded-full font-medium shadow-md shadow-primary/20">
               Дедлайн: до 15 апреля
             </div>
          </div>

          <div className="bg-card p-8 md:p-12 rounded-3xl shadow-sm border border-border">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-foreground">ФИО (полные, для заселения) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Иванов Иван Иванович" className="bg-background border-border/60 focus-visible:ring-primary rounded-xl h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telegram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-foreground">Имя пользователя в Telegram *</FormLabel>
                      <FormControl>
                        <Input placeholder="@username" className="bg-background border-border/60 focus-visible:ring-primary rounded-xl h-12" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base text-foreground">Телефон *</FormLabel>
                      <FormControl>
                        <Input placeholder="+7 999 123-45-67" type="tel" inputMode="tel" autoComplete="tel" className="bg-background border-border/60 focus-visible:ring-primary rounded-xl h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transfer"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base text-foreground">Трансфер *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 bg-background p-4 rounded-xl border border-border/60">
                            <FormControl>
                              <RadioGroupItem value="need" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer w-full">
                              Понадобится трансфер
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 bg-background p-4 rounded-xl border border-border/60">
                            <FormControl>
                              <RadioGroupItem value="self" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer w-full">
                              Доеду самостоятельно
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="drinks"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base text-foreground">Из напитков предпочитаю *</FormLabel>
                        <p className="text-sm text-muted-foreground mt-1">Можно выбрать несколько вариантов</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {drinkOptions.map((option) => (
                          <FormField
                            key={option.id}
                            control={form.control}
                            name="drinks"
                            render={({ field }) => {
                              const isChecked = field.value?.includes(option.id) ?? false;

                              return (
                                <FormItem
                                  key={option.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/40"
                                  onClick={() =>
                                    field.onChange(toggleDrinkSelection(field.value, option.id))
                                  }
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={isChecked}
                                      onClick={(event) => event.stopPropagation()}
                                      onCheckedChange={(checked) => {
                                        field.onChange(
                                          toggleDrinkSelection(
                                            field.value,
                                            option.id,
                                            checked === "indeterminate"
                                              ? true
                                              : checked,
                                          ),
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="w-full cursor-pointer font-normal text-foreground">
                                    {option.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isSmartCaptchaEnabled ? (
                  <RsvpSmartCaptcha
                    errorMessage={captchaErrorMessage}
                    instanceKey={captchaInstanceKey}
                    siteKey={smartCaptchaSiteKey}
                    onJavascriptError={() =>
                      reloadCaptcha("Не удалось загрузить капчу. Обновите страницу и попробуйте еще раз.")
                    }
                    onNetworkError={() =>
                      reloadCaptcha("Не удалось связаться с SmartCaptcha. Проверьте интернет и попробуйте снова.")
                    }
                    onSuccess={(token) => {
                      setCaptchaToken(token);
                      setCaptchaErrorMessage(null);
                    }}
                    onTokenExpired={() =>
                      reloadCaptcha("Проверка истекла. Пожалуйста, пройдите капчу еще раз.")
                    }
                  />
                ) : null}

                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-medium transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Отправляем..." : "Отправить ответ"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </section>

      {/* Footer / Contacts */}
      <footer className="bg-foreground text-background py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="font-serif text-2xl md:text-3xl mb-8">Остались вопросы?</h3>
          <p className="text-background/70 mb-8 font-light text-lg">
            Если у вас остались дополнительные вопросы, мы рады связать вас с нашим организатором
          </p>
          
          <div className="inline-flex flex-col items-center p-8 border border-background/20 rounded-2xl backdrop-blur-sm bg-background/5">
            <span className="font-medium text-xl mb-2 text-primary">Даша Затравкина</span>
            <a href="tel:+79653699177" className="text-lg hover:text-primary transition-colors mb-2">+7 965 369 9177</a>
            <a href="https://t.me/zatravkina" target="_blank" rel="noreferrer" className="text-lg hover:text-primary transition-colors flex items-center gap-2">
              <span className="opacity-60">tg:</span> @zatravkina
            </a>
          </div>
          
          <div className="mt-16 pt-8 border-t border-background/20 flex flex-col items-center justify-center gap-4 text-background/40 text-sm">
             <div className="font-serif text-xl tracking-widest uppercase">О & О</div>
             <p>Wedding Road Trip • 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

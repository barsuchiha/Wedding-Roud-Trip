import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarHeart, MapPin, Gift, Clock, Navigation, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// @ts-ignore
import heroBg from '@/assets/images/hero-bg.png';
// @ts-ignore
import dinnerImg from '@/assets/images/dinner.png';
// @ts-ignore
import vinylImg from '@/assets/images/vinyl.png';
// @ts-ignore
import venueImg from '@/assets/images/venue.png';

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Пожалуйста, введите ваше полное ФИО" }),
  transfer: z.enum(["need", "self"], { required_error: "Выберите вариант трансфера" }),
  drinks: z.array(z.string()).min(1, { message: "Выберите хотя бы один напиток" })
});

const drinkOptions = [
  { id: "beer", label: "Пиво" },
  { id: "white_wine", label: "Вино белое" },
  { id: "red_wine", label: "Вино красное" },
  { id: "sparkling", label: "Игристое" },
  { id: "non_alcoholic", label: "Безалкогольное" }
];

export default function Home() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      drinks: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Спасибо, ждем вас!",
        description: "Ваш ответ успешно отправлен.",
      });
      form.reset();
    }, 1500);
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
          <Button onClick={() => scrollTo('rsvp')} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-serif italic text-lg h-10 px-6 rounded-full">
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
            <span className="italic text-accent">Роуд-Трип</span>
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
                Праздник <br/><span className="italic text-primary">любви</span>
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
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Программа уикенда</h2>
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
            <div className="space-y-6">
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
            </div>

            {/* Gifts */}
            <div className="space-y-6">
              <div className="inline-block px-4 py-1 border border-primary/30 rounded-full text-primary text-sm uppercase tracking-widest mb-2">Подарки</div>
              <h2 className="text-3xl md:text-4xl font-serif">Вклад в планы</h2>
              <p className="text-muted-foreground leading-relaxed text-lg font-light">
                Нам будет приятно, если вы поздравите нас денежным вкладом в наши совместные планы или выберите что-то из вишлиста. А вместо цветов мы были бы очень рады виниловой пластинке в нашу коллекцию.
              </p>
              
              <div className="pt-4 flex items-center gap-4">
                <img src={vinylImg} alt="Винил" className="w-20 h-20 rounded-full object-cover border-4 border-background shadow-md spin-slow" style={{ animation: 'spin 10s linear infinite' }} />
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full">
                  <Gift className="w-4 h-4 mr-2" />
                  Открыть вишлист
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
                Приглашаем вас в загородный отель <strong className="text-foreground font-medium">Чехов Api</strong> — проживание и питание оплачено с 1 по 2 августа.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-foreground">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Заселение с 15:00, выселение в 12:00</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Московская область, Чехов Api</span>
                </div>
              </div>
              
              <Button className="w-fit rounded-full bg-secondary hover:bg-secondary/90 text-white">
                <Navigation className="w-4 h-4 mr-2" />
                Построить маршрут
              </Button>
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
               Дедлайн: до 1 апреля
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
                  name="transfer"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base text-foreground">Трансфер *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                              return (
                                <FormItem
                                  key={option.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 bg-background p-4 rounded-xl border border-border/60 cursor-pointer"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(option.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, option.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== option.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer w-full text-foreground">
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
          <h3 className="font-serif text-2xl md:text-3xl mb-8 italic">Остались вопросы?</h3>
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
             <p>Wedding Road Trip • 2024</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import type {
  Criterion, DB, Dish, Employee, Evaluation, EvalResult, Expectation, Feedback, FeedbackType,
  Ficha, LogEntry, Recording, Supervision, User,
} from '../types';

/**
 * Todos os dados abaixo são fictícios. As datas são relativas ao primeiro acesso,
 * para os filtros de período continuarem coerentes no dia da apresentação.
 */
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export const HOUSE = 'Bar do Seu Arlindo';
export const MASTER = 'Seu Arlindo Prado';
export const DEMO_PASSWORD = 'pontozero';

export const USERS: User[] = [
  { id: 'u-admin', name: 'Helena Prado', email: 'gestora@pontozero.demo', role: 'admin', title: 'Gestora da casa' },
  { id: 'u-mestre', name: MASTER, email: 'mestre@pontozero.demo', role: 'mestre', title: 'Cozinheiro mestre, 31 anos de casa' },
  { id: 'u-aprendiz', name: 'Beatriz Lima', email: 'aprendiz@pontozero.demo', role: 'aprendiz', title: 'Cozinheira júnior', employeeId: 'e-bia' },
];

const dishes: Dish[] = [
  {
    id: 'feijoada', name: 'Feijoada da casa', art: 'feijoada',
    tagline: 'Servida aos sábados desde a abertura. O caldo é a assinatura da casa.',
    steps: [
      {
        id: 'fj1', title: 'Preparação das carnes', critical: false, status: 'aprovado',
        description: 'Separar, dessalgar e cortar as carnes na ordem em que entram na panela.',
        observar: 'A carne salgada deve perder a crosta branca e ficar macia ao aperto.',
        fazer: 'Troque a água de dessalga e prove um pedaço pequeno antes de seguir.',
        evitar: 'Não misture carnes defumadas e salgadas na mesma bacia.',
      },
      {
        id: 'fj2', title: 'Início do cozimento do feijão', critical: false, status: 'aprovado',
        description: 'Feijão com as carnes mais duras, em fogo que mantenha só uma fervura leve.',
        observar: 'A superfície borbulha devagar, sem agitar os grãos.',
        fazer: 'Retire a espuma clara que sobe nos primeiros minutos.',
        evitar: 'Não mexa com força: o grão quebrado turva o caldo cedo demais.',
      },
      {
        id: 'fj3', title: 'Ponto do caldo', critical: true, status: 'aprovado',
        description: 'Momento em que o caldo deixa de ser ralo e começa a encorpar.',
        observar: 'O caldo escurece e passa a cobrir as costas da concha.',
        fazer: 'Amasse uma concha de grãos na lateral da panela e devolva ao caldo.',
        evitar: 'Não use só o relógio como critério. O ponto muda com o feijão e com a panela.',
        fala: 'Quando a concha sai pintada, a panela está pedindo o refogado.',
      },
      {
        id: 'fj4', title: 'Entrada do refogado', critical: true, status: 'revisao',
        description: 'Alho e cebola dourados entram no caldo já encorpado, junto com a linguiça.',
        observar: 'O alho deve chegar perfumado e dourado claro, nunca escuro.',
        fazer: 'Despeje o refogado no centro da panela e mexa uma única vez, de baixo para cima.',
        evitar: 'Não deixe o alho escurecer: amarga a panela inteira.',
      },
      {
        id: 'fj5', title: 'Finalização e descanso', critical: false, status: 'aprovado',
        description: 'Acerto final do sal e descanso com a panela tampada.',
        observar: 'O brilho do caldo fica uniforme e a gordura se integra.',
        fazer: 'Prove só depois do descanso. O sal muda quando a panela assenta.',
        evitar: 'Não corrija o sal enquanto o caldo ainda está em fervura forte.',
      },
      {
        id: 'fj6', title: 'Conferência do resultado', critical: false, status: 'aprovado',
        description: 'Prova final e comparação com o padrão da casa antes de servir.',
        observar: 'Aroma defumado presente, sem encobrir o feijão. Grãos inteiros e macios.',
        fazer: 'Sirva uma concha em prato raso e confira cor, brilho e consistência.',
        evitar: 'Não libere a panela sem a prova de quem responde pelo turno.',
      },
    ],
  },
  {
    id: 'carne-panela', name: 'Carne de panela', art: 'carne',
    tagline: 'O prato feito de quinta. O molho nasce do fundo da panela.',
    steps: [
      {
        id: 'cp1', title: 'Preparação da carne', critical: false, status: 'aprovado',
        description: 'Cortar em pedaços iguais e secar bem antes de selar.',
        observar: 'Pedaços parecidos entre si e superfície sem umidade.',
        fazer: 'Seque com pano limpo destinado à cozinha ou papel próprio.',
        evitar: 'Não tempere com sal muito antes: a carne solta água.',
      },
      {
        id: 'cp2', title: 'Selagem e fundo da panela', critical: true, status: 'aprovado',
        description: 'Dourar em poucas levas para formar o fundo escuro que dá cor ao molho.',
        observar: 'O chiado continua forte e a carne solta sozinha do fundo.',
        fazer: 'Espere soltar antes de virar e trabalhe em levas pequenas.',
        evitar: 'Não encha a panela: a carne cozinha na própria água e não doura.',
        fala: 'Se você precisou puxar a carne, ainda não era a hora.',
      },
      {
        id: 'cp3', title: 'Refogado e deglaçagem', critical: false, status: 'aprovado',
        description: 'Cebola no mesmo fundo, soltando o que ficou grudado com um pouco de líquido.',
        observar: 'O fundo escuro se dissolve e o líquido ganha cor de caramelo.',
        fazer: 'Raspe a panela com colher de pau enquanto o líquido ferve.',
        evitar: 'Não lave nem troque a panela nesta etapa.',
      },
      {
        id: 'cp4', title: 'Cozimento lento', critical: true, status: 'aprovado',
        description: 'Carne de volta à panela, com líquido só até a metade dos pedaços.',
        observar: 'A carne cede ao garfo, sem desmanchar por inteiro.',
        fazer: 'Complete o líquido aos poucos e vire os pedaços uma vez.',
        evitar: 'Não cubra a carne de água: o molho perde corpo.',
      },
      {
        id: 'cp5', title: 'Ponto do molho e conferência', critical: false, status: 'revisao',
        description: 'Redução final e prova junto com o acompanhamento.',
        observar: 'O molho desliza devagar na colher e deixa uma camada brilhante.',
        fazer: 'Prove com arroz, do jeito que o cliente vai comer.',
        evitar: 'Não engrosse com farinha para ganhar tempo.',
      },
    ],
  },
  {
    id: 'caldo', name: 'Caldo tradicional', art: 'caldo',
    tagline: 'Pedido certo das noites frias, com mandioca e costelinha.',
    steps: [
      {
        id: 'cl1', title: 'Preparação da mandioca', critical: false, status: 'aprovado',
        description: 'Descascar, retirar o fio central e cortar em pedaços parecidos.',
        observar: 'Polpa clara, sem manchas escuras ou fibras duras.',
        fazer: 'Mantenha os pedaços cobertos com água limpa até cozinhar.',
        evitar: 'Não aproveite pedaços com pontos escuros.',
      },
      {
        id: 'cl2', title: 'Base de costelinha', critical: false, status: 'aprovado',
        description: 'Dourar a costelinha e formar a base de sabor com cebola e alho.',
        observar: 'A gordura derrete e a carne ganha cor nas pontas.',
        fazer: 'Retire o excesso de gordura antes de refogar.',
        evitar: 'Não queime o fundo: o caldo é claro e denuncia.',
      },
      {
        id: 'cl3', title: 'Ponto da mandioca', critical: true, status: 'aprovado',
        description: 'Cozinhar até a mandioca abrir e se desmanchar na pressão da colher.',
        observar: 'As bordas ficam translúcidas e os pedaços começam a abrir.',
        fazer: 'Teste sempre o pedaço maior da panela.',
        evitar: 'Não bata mandioca que ainda resiste à colher.',
      },
      {
        id: 'cl4', title: 'Textura do caldo', critical: true, status: 'correcao',
        correction: 'Mestre pediu para regravar: a textura final não aparece bem de perto.',
        description: 'Bater parte da mandioca e ajustar a textura com o líquido do cozimento.',
        observar: 'O caldo cobre a colher sem formar massa.',
        fazer: 'Acrescente o líquido do cozimento aos poucos.',
        evitar: 'Não adicione água fria ao caldo pronto.',
      },
      {
        id: 'cl5', title: 'Finalização', critical: false, status: 'revisao',
        description: 'Volta da costelinha desfiada, acerto de sal e cheiro-verde na hora de servir.',
        observar: 'Cor uniforme e cheiro-verde ainda vivo.',
        fazer: 'Finalize por porção, na hora de servir.',
        evitar: 'Não deixe o cheiro-verde cozinhando na panela.',
      },
    ],
  },
  {
    id: 'dobradinha', name: 'Dobradinha', art: 'dobradinha',
    tagline: 'Receita de quem conhece a casa. Maciez é a palavra.',
    steps: [
      {
        id: 'db1', title: 'Limpeza do bucho', critical: false, status: 'aprovado',
        description: 'Lavar, aparar e branquear conforme o procedimento da casa.',
        observar: 'Superfície limpa, sem odor forte e sem partes escuras.',
        fazer: 'Use bancada e utensílios exclusivos nesta etapa e higienize tudo ao terminar.',
        evitar: 'Não reaproveite a água do branqueamento.',
      },
      {
        id: 'db2', title: 'Cozimento do bucho', critical: true, status: 'aprovado',
        description: 'Cozinhar até a maciez que a casa considera ideal.',
        observar: 'O garfo entra sem esforço, mas a tira mantém o formato.',
        fazer: 'Teste uma tira de cada canto da panela.',
        evitar: 'Não pare pelo tempo: peças diferentes amaciam em momentos diferentes.',
      },
      {
        id: 'db3', title: 'Feijão-branco', critical: false, status: 'aprovado',
        description: 'Cozinhar o feijão-branco separado, preservando os grãos inteiros.',
        observar: 'Grão macio por dentro, com a casca inteira.',
        fazer: 'Separe uma parte do líquido para ajustar o molho.',
        evitar: 'Não cozinhe o feijão junto com o bucho.',
      },
      {
        id: 'db4', title: 'Refogado com linguiça e paio', critical: false, status: 'revisao',
        description: 'Dourar os embutidos e refogar a base com tomate e temperos.',
        observar: 'A gordura fica alaranjada e o tomate perde a acidez crua.',
        fazer: 'Dê tempo para o tomate secar antes de juntar o restante.',
        evitar: 'Não apresse o tomate com água.',
      },
      {
        id: 'db5', title: 'União e apuro', critical: true, status: 'revisao',
        description: 'Juntar bucho, feijão e refogado e deixar apurar sem desfazer os grãos.',
        observar: 'O molho encorpa e envolve as tiras.',
        fazer: 'Mexa com colher larga e movimentos curtos.',
        evitar: 'Não ferva forte depois de unir tudo.',
      },
      {
        id: 'db6', title: 'Conferência do resultado', critical: false, status: 'revisao',
        description: 'Prova de maciez, sal e equilíbrio do molho antes de servir.',
        observar: 'Tiras macias, grãos inteiros e molho sem acidez.',
        fazer: 'Prove uma colher com bucho, feijão e molho juntos.',
        evitar: 'Não finalize sem conferir a maciez de mais de uma tira.',
      },
    ],
  },
];

const spread = (ids: string[], marks: number[]) =>
  Object.fromEntries(ids.map((id, i) => [id, [marks[i], marks[i + 1]] as [number, number]]));

const FJ = ['fj1', 'fj2', 'fj3', 'fj4', 'fj5', 'fj6'];

const recordings: Recording[] = [
  {
    id: 'rec-fj-1', dishId: 'feijoada', label: 'Gravação 1', date: daysAgo(40), occasion: 'Sábado, turno do almoço',
    recordedBy: 'Helena Prado', consent: true, duration: 2640, times: spread(FJ, [0, 420, 1080, 1560, 2040, 2400, 2640]),
    result: 'Caldo encorpado e brilhante, avaliado pelo mestre como dentro do padrão da casa.',
    cells: {
      fj1: { gesto: 'Aperta cada peça com os dedos antes de separar.', criterio: 'Maciez ao aperto e prova de um pedaço.' },
      fj2: { gesto: 'Retira a espuma com escumadeira, sem mexer o fundo.', criterio: 'Borbulho leve na superfície.' },
      fj3: { gesto: 'Amassa uma concha de grãos na lateral da panela.', criterio: 'Caldo cobrindo as costas da concha.' },
      fj4: { gesto: 'Despeja o refogado no centro e mexe uma vez.', criterio: 'Alho dourado claro e aroma aberto.' },
      fj5: { gesto: 'Tampa a panela e só prova após o descanso.', criterio: 'Brilho uniforme do caldo.' },
      fj6: { gesto: 'Serve em prato raso para olhar a cor.', criterio: 'Cor, brilho e grãos inteiros.' },
    },
  },
  {
    id: 'rec-fj-2', dishId: 'feijoada', label: 'Gravação 2', date: daysAgo(26), occasion: 'Sábado, casa cheia',
    recordedBy: 'Helena Prado', consent: true, duration: 2280, times: spread(FJ, [0, 300, 900, 1320, 1800, 2100, 2280]),
    result: 'Caldo um pouco mais fino. O mestre atribuiu ao ritmo do salão e pediu para conferir a entrada do refogado.',
    cells: {
      fj1: { gesto: 'Separa as peças mais rápido, sem provar.', criterio: 'Só a maciez ao aperto.' },
      fj2: { gesto: 'Retira a espuma com escumadeira.', criterio: 'Borbulho leve na superfície.' },
      fj3: { gesto: 'Amassa os grãos na lateral, em menor quantidade.', criterio: 'Olha o escorrer da concha.' },
      fj4: { gesto: 'Coloca a linguiça antes do refogado.', criterio: 'Refogado entra quando o salão pede a panela.' },
      fj5: { gesto: 'Descanso mais curto, com a panela tampada.', criterio: 'Brilho do caldo.' },
      fj6: { gesto: 'Prova direto na concha.', criterio: 'Sal e aroma.' },
    },
  },
  {
    id: 'rec-fj-3', dishId: 'feijoada', label: 'Gravação 3', date: daysAgo(12), occasion: 'Terça, preparo sem pressa',
    recordedBy: 'Beatriz Lima, com autorização do mestre', consent: true, duration: 2820, times: spread(FJ, [0, 480, 1200, 1740, 2220, 2580, 2820]),
    result: 'Caldo encorpado. O mestre comentou que esse é o jeito que prefere ensinar.',
    cells: {
      fj1: { gesto: 'Aperta cada peça e prova um pedaço.', criterio: 'Maciez ao aperto e prova de um pedaço.' },
      fj2: { gesto: 'Retira a espuma e ajusta o fogo duas vezes.', criterio: 'Borbulho leve na superfície.' },
      fj3: { gesto: 'Amassa uma concha cheia de grãos na lateral.', criterio: 'Caldo cobrindo as costas da concha.' },
      fj4: { gesto: 'Doura o alho em fogo menor antes de despejar.', criterio: 'Alho dourado claro e aroma aberto.' },
      fj5: { gesto: 'Descanso mais longo, com a panela tampada.', criterio: 'Brilho uniforme e gordura integrada.' },
      fj6: { gesto: 'Serve em prato raso e chama o responsável.', criterio: 'Cor, brilho e grãos inteiros.' },
    },
  },
  {
    id: 'rec-cp-1', dishId: 'carne-panela', label: 'Gravação 1', date: daysAgo(33), occasion: 'Quinta, turno do almoço',
    recordedBy: 'Helena Prado', consent: true, duration: 2100,
    times: spread(['cp1', 'cp2', 'cp3', 'cp4', 'cp5'], [0, 300, 840, 1140, 1800, 2100]), cells: {}, result: '',
  },
  {
    id: 'rec-cl-1', dishId: 'caldo', label: 'Gravação 1', date: daysAgo(21), occasion: 'Sexta, abertura da noite',
    recordedBy: 'Helena Prado', consent: true, duration: 1680,
    times: spread(['cl1', 'cl2', 'cl3', 'cl4', 'cl5'], [0, 240, 660, 1140, 1500, 1680]), cells: {}, result: '',
  },
  {
    id: 'rec-db-1', dishId: 'dobradinha', label: 'Gravação 1', date: daysAgo(15), occasion: 'Quarta, preparo da manhã',
    recordedBy: 'Helena Prado', consent: true, duration: 2460,
    times: spread(['db1', 'db2', 'db3', 'db4', 'db5', 'db6'], [0, 360, 1020, 1320, 1680, 2220, 2460]), cells: {}, result: '',
  },
];

const SAFETY = [
  'Higienize as mãos antes de começar e sempre que trocar de tarefa.',
  'Mantenha ingredientes crus separados dos prontos, com utensílios próprios.',
  'Siga o manual de boas práticas da casa para conservação e reaquecimento.',
  'Consulte vídeo e ficha fora da área de manipulação. Celular pessoal não entra na bancada.',
];

const ficha = (
  dishId: string, description: string, rendimento: string, tempo: string,
  ingredients: [string, string, string][], utensilios: string[],
  sequencia: [string, string, string][], sensoriais: string[], observacoes: string,
  extraSafety: string[], updated: number, validatedBy: string,
): Ficha => ({
  dishId, description, rendimento, tempo, utensilios, sensoriais, observacoes,
  ingredients: ingredients.map(([item, qty, unit]) => ({ item, qty, unit })),
  sequencia: sequencia.map(([text, stepId, complemento]) => ({ text, stepId, complemento })),
  seguranca: [...extraSafety, ...SAFETY],
  updatedAt: daysAgo(updated), validatedBy,
  versions: [
    { version: 2, at: daysAgo(updated), by: validatedBy, note: 'Critérios sensoriais revisados depois das gravações.' },
    { version: 1, at: daysAgo(updated + 30), by: 'Helena Prado', note: 'Primeiro registro escrito da receita.' },
  ],
});

const fichas: Record<string, Ficha> = {
  feijoada: ficha('feijoada', 'Feijoada de caldo encorpado e defumado equilibrado, servida aos sábados.',
    '20 porções', 'Referência de meio turno, sem contar a dessalga. Quem define o fim é o ponto do caldo.',
    [['Feijão-preto', '2', 'kg'], ['Carne-seca', '1', 'kg'], ['Costelinha salgada', '1', 'kg'], ['Lombo salgado', '800', 'g'], ['Linguiça calabresa', '1', 'kg'], ['Paio', '500', 'g'], ['Bacon', '300', 'g'], ['Alho', '1', 'cabeça'], ['Cebola', '3', 'unidades'], ['Louro', '4', 'folhas']],
    ['Panela grande de fundo grosso', 'Concha funda', 'Escumadeira', 'Bacias separadas para dessalga'],
    [['Dessalgar e cortar as carnes.', 'fj1', 'Veja como o mestre testa a maciez antes de seguir.'],
      ['Cozinhar o feijão com as carnes mais duras.', 'fj2', 'Veja qual fervura o mestre mantém e quando tira a espuma.'],
      ['Encorpar o caldo.', 'fj3', 'Veja o teste da concha que indica o momento certo.'],
      ['Refogar alho e cebola e juntar à panela.', 'fj4', 'Veja a cor do alho e o único movimento de mexer.'],
      ['Acertar o sal e deixar descansar.', 'fj5', 'Veja por que a prova vem depois do descanso.'],
      ['Conferir antes de servir.', 'fj6', 'Veja a conferência em prato raso.']],
    ['Caldo cobre as costas da concha.', 'Grãos inteiros e macios.', 'Defumado presente, sem encobrir o feijão.', 'Brilho uniforme.'],
    'A quantidade de água muda conforme o feijão. O mestre ajusta pela aparência do caldo.',
    ['Faça a dessalga sob refrigeração, conforme o manual da casa.'], 18, MASTER),
  'carne-panela': ficha('carne-panela', 'Carne macia em molho escuro, nascido do fundo da panela.',
    '12 porções', 'Referência de meio turno. O ponto é a carne ceder ao garfo.',
    [['Acém em cubos grandes', '3', 'kg'], ['Cebola', '4', 'unidades'], ['Alho', '6', 'dentes'], ['Tomate', '3', 'unidades'], ['Louro', '2', 'folhas'], ['Sal', 'a gosto do mestre', ''], ['Óleo', '60', 'ml']],
    ['Panela de ferro ou fundo grosso', 'Colher de pau', 'Pinça', 'Garfo de prova'],
    [['Cortar e secar a carne.', 'cp1', 'Veja o tamanho dos pedaços usados pelo mestre.'],
      ['Selar a carne.', 'cp2', 'Veja o sinal de que a carne soltou sozinha do fundo.'],
      ['Refogar os ingredientes.', 'cp3', 'Veja quais sinais o mestre usa para determinar o ponto correto.'],
      ['Cozinhar lentamente.', 'cp4', 'Veja até onde vai o líquido e como é feita a prova do garfo.'],
      ['Reduzir o molho e conferir.', 'cp5', 'Veja o molho deslizando na colher.']],
    ['Carne cede ao garfo sem desmanchar.', 'Molho escuro e brilhante.', 'Sal equilibrado quando provado com arroz.'],
    'O molho não recebe farinha. O corpo vem da redução.', [], 24, MASTER),
  caldo: ficha('caldo', 'Caldo cremoso de mandioca com costelinha desfiada.',
    '15 porções', 'Referência de um terço do turno. Depende da mandioca do dia.',
    [['Mandioca', '3', 'kg'], ['Costelinha suína', '1,5', 'kg'], ['Cebola', '2', 'unidades'], ['Alho', '5', 'dentes'], ['Cheiro-verde', '1', 'maço']],
    ['Panela grande', 'Mixer ou liquidificador da cozinha', 'Colher larga'],
    [['Preparar a mandioca.', 'cl1', 'Veja como o mestre escolhe os pedaços.'],
      ['Dourar a costelinha e fazer a base.', 'cl2', 'Veja a cor buscada nas pontas.'],
      ['Cozinhar a mandioca.', 'cl3', 'Veja o teste feito com a colher.'],
      ['Bater e ajustar a textura.', 'cl4', 'Trecho em revisão: o mestre pediu nova gravação.'],
      ['Finalizar e servir.', 'cl5', 'Veja quando entra o cheiro-verde.']],
    ['Cobre a colher sem formar massa.', 'Cor clara e uniforme.', 'Cheiro-verde vivo.'],
    'A etapa de textura ainda está em validação pelo mestre.', [], 21, 'Validação parcial por ' + MASTER),
  dobradinha: ficha('dobradinha', 'Dobradinha com feijão-branco, linguiça e paio, em molho encorpado.',
    '14 porções', 'Referência de um turno. Depende da maciez do bucho.',
    [['Bucho bovino limpo', '3', 'kg'], ['Feijão-branco', '1', 'kg'], ['Linguiça calabresa', '500', 'g'], ['Paio', '300', 'g'], ['Tomate', '5', 'unidades'], ['Cebola', '3', 'unidades'], ['Alho', '6', 'dentes']],
    ['Duas panelas grandes', 'Bancada exclusiva para limpeza', 'Colher larga', 'Garfo de prova'],
    [['Limpar e branquear o bucho.', 'db1', 'Veja o procedimento de limpeza usado pela casa.'],
      ['Cozinhar o bucho.', 'db2', 'Veja a prova de maciez em várias tiras.'],
      ['Cozinhar o feijão-branco à parte.', 'db3', 'Veja como o grão fica macio e inteiro.'],
      ['Refogar embutidos e tomate.', 'db4', 'Veja a cor da gordura e do tomate.'],
      ['Unir e apurar.', 'db5', 'Veja como mexer sem desfazer os grãos.'],
      ['Conferir o resultado.', 'db6', 'Veja a prova com bucho, feijão e molho juntos.']],
    ['Tiras macias que mantêm o formato.', 'Grãos inteiros.', 'Molho sem acidez.'],
    'Três etapas ainda aguardam validação do mestre.',
    ['Limpeza do bucho somente em bancada exclusiva, higienizada ao final.'], 15, 'Validação parcial por ' + MASTER),
};

const baseCriteria = (s: string, a: string, t: string, p: string, c: string): Criterion[] => [
  { id: 'sabor', label: 'Sabor', expected: s, active: true },
  { id: 'aroma', label: 'Aroma', expected: a, active: true },
  { id: 'textura', label: 'Textura', expected: t, active: true },
  { id: 'aparencia', label: 'Aparência', expected: p, active: true },
  { id: 'consistencia', label: 'Consistência com o padrão habitual', expected: c, active: true },
];

const criteria: Record<string, Criterion[]> = {
  feijoada: baseCriteria('Feijão em primeiro plano, sal equilibrado depois do descanso.', 'Defumado presente, sem cheiro de alho queimado.', 'Caldo encorpado e grãos inteiros e macios.', 'Caldo escuro, brilhante e uniforme.', 'Reconhecível como a feijoada de sábado.'),
  'carne-panela': baseCriteria('Sabor profundo do fundo da panela, sal equilibrado com arroz.', 'Cebola caramelizada e carne dourada.', 'Carne cede ao garfo sem desmanchar. Molho deslizante.', 'Molho escuro e brilhante.', 'Reconhecível como a carne de panela de quinta.'),
  caldo: baseCriteria('Mandioca e costelinha equilibradas.', 'Refogado suave e cheiro-verde fresco.', 'Cobre a colher, sem massa.', 'Cor clara e uniforme.', 'Reconhecível como o caldo da casa.'),
  dobradinha: [
    ...baseCriteria('Molho sem acidez, embutidos presentes.', 'Limpo, sem odor forte do bucho.', 'Molho encorpado e grãos inteiros.', 'Molho alaranjado envolvendo as tiras.', 'Reconhecível como a dobradinha da casa.'),
    { id: 'maciez', label: 'Maciez do bucho', expected: 'Garfo entra sem esforço e a tira mantém o formato.', active: true },
  ],
};

const employees: Employee[] = [
  {
    id: 'e-caio', name: 'Caio Mendes', role: 'Auxiliar de cozinha', since: 'Na casa há 8 meses',
    learning: ['carne-panela', 'feijoada'],
    activities: [{ at: daysAgo(30), text: 'Acompanhou o mestre no preparo da carne de panela.' }],
  },
  {
    id: 'e-bia', name: 'Beatriz Lima', role: 'Cozinheira júnior', since: 'Na casa há 2 anos',
    learning: ['feijoada', 'caldo'],
    activities: [{ at: daysAgo(12), text: 'Registrou a Gravação 3 da feijoada, com autorização do mestre.' }],
  },
  {
    id: 'e-rafa', name: 'Rafael Nunes', role: 'Auxiliar de cozinha', since: 'Na casa há 4 meses',
    learning: ['dobradinha', 'carne-panela'],
    activities: [{ at: daysAgo(20), text: 'Iniciou o acompanhamento da limpeza do bucho.' }],
  },
];

let evalN = 0;
const ev = (
  employeeId: string, dishId: string, ago: number, batch: string,
  s: [number, number, number, number, number], proc: [number, number, number], supervisao: Supervision,
  result: EvalResult, stepsApproved: string[], observacoes: string,
): Evaluation => ({
  id: `ev-${++evalN}`, employeeId, dishId, date: daysAgo(ago), evaluator: MASTER, batch,
  scores: { sabor: s[0], aroma: s[1], textura: s[2], aparencia: s[3], consistencia: s[4] },
  sequencia: proc[0], momentos: proc[1], higiene: proc[2], supervisao, result, stepsApproved, observacoes,
});

const evaluations: Evaluation[] = [
  ev('e-caio', 'carne-panela', 27, 'Almoço de quinta', [3, 3, 3, 3, 3], [4, 3, 5], 'constante', 'aprovado', ['cp1'], 'Corte e secagem bons. Ainda vira a carne antes da hora.'),
  ev('e-caio', 'carne-panela', 13, 'Almoço de quinta', [4, 4, 3, 4, 4], [4, 3, 5], 'pontual', 'aprovado', ['cp2', 'cp3'], 'Fundo bem formado. Molho ainda ralo no final.'),
  ev('e-caio', 'feijoada', 19, 'Panela de teste', [3, 4, 3, 3, 3], [4, 3, 4], 'constante', 'aprovado', ['fj1', 'fj2'], 'Boa preparação. Precisa enxergar o ponto do caldo.'),
  ev('e-bia', 'feijoada', 34, 'Sábado, segunda panela', [4, 4, 4, 4, 4], [4, 4, 5], 'pontual', 'aprovado', ['fj1', 'fj2'], 'Segura a fervura com tranquilidade.'),
  ev('e-bia', 'feijoada', 18, 'Sábado, segunda panela', [4, 5, 4, 4, 4], [5, 4, 5], 'pontual', 'aprovado', ['fj3', 'fj5'], 'Reconheceu o ponto do caldo sem ajuda.'),
  ev('e-bia', 'feijoada', 6, 'Sábado, primeira panela', [5, 4, 4, 5, 4], [5, 4, 5], 'sem', 'aprendizagem', [], 'Alho passou um pouco. Repetir a entrada do refogado.'),
  ev('e-bia', 'caldo', 9, 'Noite de sexta', [4, 4, 3, 4, 4], [4, 4, 5], 'pontual', 'aprovado', ['cl1', 'cl2'], 'Textura ainda varia entre panelas.'),
  ev('e-rafa', 'dobradinha', 16, 'Preparo da manhã', [3, 3, 3, 3, 3], [4, 2, 5], 'constante', 'aprovado', ['db1'], 'Limpeza e higiene exemplares.'),
  ev('e-rafa', 'carne-panela', 10, 'Panela de teste', [3, 3, 2, 3, 2], [3, 2, 4], 'constante', 'pratica', [], 'Encheu a panela e a carne não dourou. Repetir a selagem em levas.'),
];

type FB = [string, number, number, Expectation, string, FeedbackType, string];
const fbRows: FB[] = [
  ['feijoada', 1, 5, 'sim', 'Sabor', 'elogio', 'Continua igual à de sempre. Caldo perfeito.'],
  ['feijoada', 3, 4, 'sim', 'Tempero', 'elogio', 'Muito boa, defumado no ponto.'],
  ['feijoada', 8, 3, 'nao', 'Textura', 'reclamacao', 'O caldo veio mais ralo que o de costume.'],
  ['feijoada', 8, 4, 'nao_sei', 'Sabor', 'elogio', 'Primeira vez aqui, gostei bastante.'],
  ['feijoada', 15, 5, 'sim', 'Sabor', 'elogio', 'A melhor da região, sem dúvida.'],
  ['feijoada', 15, 3, 'nao', 'Textura', 'reclamacao', 'Achei o caldo fino, em dia de casa cheia.'],
  ['feijoada', 22, 5, 'sim', 'Apresentação', 'elogio', ''],
  ['feijoada', 29, 4, 'sim', 'Porção', 'sugestao', 'Podia vir com um pouco mais de couve.'],
  ['feijoada', 36, 5, 'sim', 'Sabor', 'elogio', 'Tradição mantida.'],
  ['feijoada', 50, 4, 'sim', 'Tempero', 'elogio', ''],
  ['carne-panela', 2, 4, 'sim', 'Sabor', 'elogio', 'Carne macia, molho gostoso.'],
  ['carne-panela', 5, 3, 'nao', 'Tempero', 'reclamacao', 'Estava mais salgada do que eu lembrava.'],
  ['carne-panela', 9, 5, 'sim', 'Textura', 'elogio', 'Desmancha no garfo do jeito certo.'],
  ['carne-panela', 12, 3, 'nao', 'Textura', 'reclamacao', 'Molho mais ralo que o normal.'],
  ['carne-panela', 19, 4, 'nao_sei', 'Sabor', 'elogio', 'Não conhecia, voltarei.'],
  ['carne-panela', 26, 5, 'sim', 'Sabor', 'elogio', ''],
  ['carne-panela', 40, 4, 'sim', 'Porção', 'sugestao', 'Um pouco mais de molho seria ótimo.'],
  ['caldo', 4, 5, 'sim', 'Sabor', 'elogio', 'Perfeito para a noite fria.'],
  ['caldo', 7, 4, 'sim', 'Tempero', 'elogio', ''],
  ['caldo', 11, 3, 'nao', 'Textura', 'reclamacao', 'Estava mais grosso do que costuma ser.'],
  ['caldo', 18, 4, 'nao_sei', 'Apresentação', 'sugestao', 'Chegou com pouco cheiro-verde.'],
  ['caldo', 31, 5, 'sim', 'Sabor', 'elogio', 'Igual ao de sempre.'],
  ['dobradinha', 3, 5, 'sim', 'Textura', 'elogio', 'Macia como deve ser.'],
  ['dobradinha', 10, 4, 'sim', 'Sabor', 'elogio', ''],
  ['dobradinha', 17, 4, 'nao_sei', 'Tempero', 'sugestao', 'Gostaria de um pouco mais de pimenta à parte.'],
  ['dobradinha', 28, 5, 'sim', 'Sabor', 'elogio', 'Só aqui eu peço dobradinha.'],
];

const feedbacks: Feedback[] = fbRows.map(([dishId, ago, rating, expected, attention, type, comment], i) => ({
  id: `fb-${i + 1}`, dishId, date: daysAgo(ago), rating, expected, attention, type, comment,
}));

const log = (id: string, dishId: string, ago: number, by: string, text: string): LogEntry => ({ id, dishId, at: daysAgo(ago), by, text });

const logs: LogEntry[] = [
  log('l1', 'feijoada', 40, 'Helena Prado', 'Gravação 1 registrada com consentimento do mestre.'),
  log('l2', 'feijoada', 26, 'Helena Prado', 'Gravação 2 registrada com consentimento do mestre.'),
  log('l3', 'feijoada', 18, MASTER, 'Orientações do ponto do caldo aprovadas.'),
  log('l4', 'feijoada', 12, 'Beatriz Lima', 'Gravação 3 registrada com autorização do mestre.'),
  log('l5', 'carne-panela', 24, MASTER, 'Orientações de selagem e cozimento lento aprovadas.'),
  log('l6', 'caldo', 20, MASTER, 'Correção solicitada na etapa Textura do caldo.'),
  log('l7', 'dobradinha', 15, MASTER, 'Etapas de limpeza, cozimento e feijão aprovadas.'),
];

export const createSeed = (): DB => ({
  dishes, recordings, logs, fichas, employees, evaluations, feedbacks, criteria,
  marks: {
    'feijoada:fj4': { kind: 'divergencia', note: 'Na Gravação 2 a linguiça entrou antes do refogado. Conversar com o mestre sobre o motivo.', by: 'Helena Prado', at: daysAgo(11) },
    'feijoada:fj3': { kind: 'consistente', note: 'O teste da concha aparece nas três ocasiões.', by: MASTER, at: daysAgo(11) },
  },
  lastSeen: {},
});

// ============================================================
// SYLLABUS NERDSBATTLE - Programme Officiel (Collège, Lycée & Supérieur)
// Conforme au programme éducatif ivoirien (MENA / APC) et francophone
// Utilisé pour la génération automatique et l'indexation des cours
// ============================================================

export const SYLLABUS = {
  // ─── MATHÉMATIQUES ──────────────────────────────────────────────────────────
  maths: {
    sixieme: [
      { slug: 'nombres-entiers-decimaux', title: 'Les nombres entiers et décimaux', tags: ['arithmétique', 'nombres'] },
      { slug: 'operations-base', title: 'Les quatre opérations et calcul mental', tags: ['calcul', 'opérations'] },
      { slug: 'fractions-ecriture', title: 'Écritures fractionnaires et partage', tags: ['fractions', 'calcul'] },
      { slug: 'droites-segments-demi-droites', title: 'Droites, demi-droites et segments', tags: ['géométrie', 'droites'] },
      { slug: 'angles-mesure', title: 'Notion d\'angles et mesure au rapporteur', tags: ['géométrie', 'angles'] },
      { slug: 'figures-planes', title: 'Figures géométriques usuelles', tags: ['géométrie', 'figures'] },
      { slug: 'symetrie-orthogonale', title: 'Symétrie orthogonale (axiale)', tags: ['géométrie', 'transformations'] },
      { slug: 'perimetres-aires', title: 'Périmètres et aires de figures usuelles', tags: ['mesures', 'calcul'] },
    ],
    cinquieme: [
      { slug: 'nombres-relatifs', title: 'Les nombres relatifs et repérage', tags: ['nombres', 'relatifs'] },
      { slug: 'operations-relatifs', title: 'Addition et soustraction de nombres relatifs', tags: ['calcul', 'relatifs'] },
      { slug: 'calcul-fractionnaire', title: 'Fractions : comparaison et opérations', tags: ['fractions', 'calcul'] },
      { slug: 'triangles-angles', title: 'Triangles et somme des angles', tags: ['géométrie', 'triangles'] },
      { slug: 'symetrie-centrale', title: 'La symétrie centrale', tags: ['géométrie', 'transformations'] },
      { slug: 'parallelogrammes', title: 'Parallélogrammes et propriétés', tags: ['géométrie', 'quadrilatères'] },
      { slug: 'proportionalite-pourcentages', title: 'Proportionnalité et pourcentages', tags: ['calcul', 'proportions'] },
      { slug: 'statistiques-tableaux', title: 'Organisation de données et graphiques', tags: ['statistiques', 'données'] },
    ],
    quatrieme: [
      { slug: 'puissances-dix-relatifs', title: 'Puissances d\'un nombre et puissances de 10', tags: ['algèbre', 'puissances'] },
      { slug: 'calcul-litteral-developpement', title: 'Calcul littéral et développement', tags: ['algèbre', 'calcul'] },
      { slug: 'equations-premier-degre', title: 'Équations du premier degré', tags: ['algèbre', 'équations'] },
      { slug: 'theoreme-pythagore', title: 'Théorème de Pythagore et réciproque', tags: ['géométrie', 'théorème'] },
      { slug: 'cosinus-angle-aigu', title: 'Cosinus d\'un angle aigu', tags: ['trigonométrie', 'géométrie'] },
      { slug: 'triangles-milieux', title: 'Droites des milieux dans un triangle', tags: ['géométrie', 'triangles'] },
      { slug: 'pyramides-cones', title: 'Pyramides et cônes de révolution', tags: ['géométrie dans l\'espace', 'volumes'] },
      { slug: 'statistiques-moyennes', title: 'Statistiques : moyennes et effectifs', tags: ['statistiques', 'moyenne'] },
    ],
    troisieme: [
      { slug: 'racines-carrees', title: 'Les racines carrées et opérations', tags: ['algèbre', 'racines'] },
      { slug: 'calcul-litteral-factorisation', title: 'Identités remarquables et factorisation', tags: ['algèbre', 'factorisation'] },
      { slug: 'equations-inequations', title: 'Équations produits et inéquations', tags: ['algèbre', 'équations'] },
      { slug: 'theoreme-thales', title: 'Théorème de Thalès et réciproque', tags: ['géométrie', 'théorème'] },
      { slug: 'trigonometrie-triangle-rectangle', title: 'Trigonométrie dans le triangle rectangle', tags: ['trigonométrie', 'angles'] },
      { slug: 'angles-inscrits', title: 'Angles inscrits et polygones réguliers', tags: ['géométrie', 'cercle'] },
      { slug: 'fonctions-lineaires-affines', title: 'Fonctions linéaires et fonctions affines', tags: ['fonctions', 'algèbre'] },
      { slug: 'vecteurs-plan-coordonnees', title: 'Vecteurs du plan et repérage cartésien', tags: ['vecteurs', 'géométrie'] },
      { slug: 'systemes-equations-lineaires', title: 'Systèmes de deux équations à deux inconnues', tags: ['algèbre', 'systèmes'] },
      { slug: 'statistiques-probabilites', title: 'Statistiques et introduction aux probabilités', tags: ['statistiques', 'probabilités'] },
    ],
    seconde: [
      { slug: 'ensembles-nombres-calculs', title: 'Ensembles de nombres et calculs dans R', tags: ['algèbre', 'ensembles'] },
      { slug: 'ordre-valeur-absolue', title: 'Ordre dans R, encadrements et valeur absolue', tags: ['analyse', 'valeur absolue'] },
      { slug: 'fonctions-generalites', title: 'Généralités sur les fonctions et variations', tags: ['analyse', 'fonctions'] },
      { slug: 'fonctions-usuelles-reference', title: 'Fonctions de référence (carré, inverse, racine)', tags: ['analyse', 'fonctions'] },
      { slug: 'polynomes-second-degre', title: 'Polynômes et trinômes du second degré', tags: ['algèbre', 'polynômes'] },
      { slug: 'vecteurs-colinearite', title: 'Vecteurs du plan, colinéarité et base', tags: ['géométrie', 'vecteurs'] },
      { slug: 'droites-plan-equations', title: 'Équations de droites et systèmes linéaires', tags: ['géométrie', 'droites'] },
      { slug: 'trigonometrie-cercle', title: 'Cercle trigonométrique et angles orientés', tags: ['trigonométrie', 'angles'] },
      { slug: 'statistiques-descriptives', title: 'Statistiques descriptives à une variable', tags: ['statistiques', 'données'] },
    ],
    premiere: [
      { slug: 'second-degre-discriminant', title: 'Équations et inéquations du second degré', tags: ['algèbre', 'discriminant'] },
      { slug: 'barycentres-plan', title: 'Barycentre de points pondérés', tags: ['géométrie', 'barycentre'] },
      { slug: 'produit-scalaire-applications', title: 'Produit scalaire et applications', tags: ['géométrie', 'produit scalaire'] },
      { slug: 'limites-continuite-intro', title: 'Limites et continuité de fonctions', tags: ['analyse', 'limites'] },
      { slug: 'derivation-tangentes', title: 'Nombre dérivé, fonction dérivée et tangentes', tags: ['analyse', 'dérivation'] },
      { slug: 'etude-fonctions-variations', title: 'Applications de la dérivation et étude de fonctions', tags: ['analyse', 'fonctions'] },
      { slug: 'suites-numeriques-arithmetiques-geometriques', title: 'Suites arithmétiques et suites géométriques', tags: ['analyse', 'suites'] },
      { slug: 'trigonometrie-formules', title: 'Formules d\'addition et de duplication', tags: ['trigonométrie', 'formules'] },
      { slug: 'denombrement-analyse-combinatoire', title: 'Dénombrement et analyse combinatoire', tags: ['probabilités', 'dénombrement'] },
      { slug: 'probabilites-conditionnelles', title: 'Probabilités conditionnelles et arbres', tags: ['probabilités', 'statistiques'] },
      { slug: 'geometrie-espace-droites-plans', title: 'Positions relatives de droites et plans dans l\'espace', tags: ['géométrie dans l\'espace'] },
    ],
    terminale: [
      { slug: 'limites-fonctions', title: 'Limites de fonctions et comparaisons', tags: ['analyse', 'limites'] },
      { slug: 'continuite-tvi', title: 'Continuité et théorème des valeurs intermédiaires', tags: ['analyse', 'continuité'] },
      { slug: 'derivation-convexite', title: 'Dérivation, convexité et points d\'inflexion', tags: ['analyse', 'convexité'] },
      { slug: 'fonction-logarithme-neperien', title: 'Fonction Logarithme Népérien', tags: ['analyse', 'logarithme'] },
      { slug: 'fonction-exponentielle', title: 'Fonction Exponentielle népérienne', tags: ['analyse', 'exponentielle'] },
      { slug: 'suites-numeriques-convergence', title: 'Suites numériques et théorèmes de convergence', tags: ['analyse', 'suites'] },
      { slug: 'calcul-integral-primitives', title: 'Calcul intégral, primitives et calcul d\'aires', tags: ['analyse', 'intégrales'] },
      { slug: 'equations-differentielles', title: 'Équations différentielles linéaires', tags: ['analyse', 'équations diff'] },
      { slug: 'nombres-complexes-algebrique', title: 'Nombres complexes : forme algébrique', tags: ['algèbre', 'complexes'] },
      { slug: 'nombres-complexes-trigonometrique', title: 'Nombres complexes : forme trigonométrique et exponentielle', tags: ['algèbre', 'complexes'] },
      { slug: 'probabilites-lois-discretes', title: 'Lois de probabilité et schéma de Bernoulli', tags: ['probabilités', 'lois'] },
      { slug: 'statistiques-deux-variables', title: 'Statistiques à deux variables et ajustement linéaire', tags: ['statistiques', 'régression'] },
      { slug: 'geometrie-espace-produit-scalaire', title: 'Produit scalaire dans l\'espace et équations cartésiennes', tags: ['géométrie dans l\'espace'] },
      { slug: 'isometries-transformations-plan', title: 'Isométries et similitudes directes du plan', tags: ['géométrie', 'similitudes'] },
    ],
    prepa1: [
      { slug: 'structures-algebriques', title: 'Structures algébriques (Groupes, Anneaux, Corps)', tags: ['algèbre', 'structures'] },
      { slug: 'reduction-endomorphismes', title: 'Réduction des endomorphismes et matrices', tags: ['algèbre linéaire', 'matrices'] },
      { slug: 'espaces-vectoriels', title: 'Espaces vectoriels normés', tags: ['analyse', 'espaces'] },
      { slug: 'suites-series', title: 'Suites et séries numériques', tags: ['analyse', 'séries'] },
      { slug: 'integrales-generalisees', title: 'Intégrales généralisées', tags: ['analyse', 'intégrales'] },
      { slug: 'equations-differentielles-lineaires', title: 'Équations différentielles linéaires d\'ordre 1 et 2', tags: ['analyse', 'EDO'] },
    ],
    prepa2: [
      { slug: 'topologie', title: 'Topologie des espaces métriques', tags: ['analyse', 'topologie'] },
      { slug: 'series-entieres', title: 'Séries entières et séries de Fourier', tags: ['analyse', 'séries'] },
      { slug: 'calcul-differentiel', title: 'Calcul différentiel à plusieurs variables', tags: ['analyse', 'différentiel'] },
      { slug: 'calcul-integral-dim2', title: 'Intégrales multiples et calcul d\'intégrales', tags: ['analyse', 'intégrales'] },
      { slug: 'probabilites-avancees', title: 'Probabilités sur univers infini', tags: ['probabilités', 'statistiques'] },
    ],
  },

  // ─── PHYSIQUE-CHIMIE ────────────────────────────────────────────────────────
  physique: {
    cinquieme: [
      { slug: 'etats-matiere-changements', title: 'Les trois états de la matière et changements d\'état', tags: ['chimie', 'matière'] },
      { slug: 'melanges-solutions-aqueuses', title: 'Mélanges, corps purs et solutions aqueuses', tags: ['chimie', 'solutions'] },
      { slug: 'circuit-electrique-simple', title: 'Circuit électrique simple et dipôles', tags: ['électricité', 'circuits'] },
      { slug: 'conducteurs-isolants', title: 'Conducteurs et isolants électriques', tags: ['électricité', 'matériaux'] },
      { slug: 'sources-lumiere-propagation', title: 'Sources de lumière et propagation rectiligne', tags: ['optique', 'lumière'] },
    ],
    quatrieme: [
      { slug: 'masse-volumique-densite', title: 'Masse volumique et densité d\'un corps', tags: ['physique', 'mesures'] },
      { slug: 'atomes-molecules-symboles', title: 'Atomes, molécules et formules chimiques', tags: ['chimie', 'atomes'] },
      { slug: 'combustions-dioxygene', title: 'Combustions du carbone et du fer dans le dioxygène', tags: ['chimie', 'combustion'] },
      { slug: 'tension-intensite-electrique', title: 'Tension électrique et intensité du courant', tags: ['électricité', 'lois'] },
      { slug: 'vitesse-mouvement', title: 'Vitesse et description du mouvement', tags: ['mécanique', 'cinématique'] },
    ],
    troisieme: [
      { slug: 'poids-masse-pesanteur', title: 'Poids, masse et champ de pesanteur', tags: ['mécanique', 'forces'] },
      { slug: 'travail-puissance-mecanique', title: 'Travail et puissance mécanique d\'une force', tags: ['mécanique', 'énergie'] },
      { slug: 'acides-bases-ph', title: 'Solutions acides, basiques et mesure du pH', tags: ['chimie', 'pH'] },
      { slug: 'reactions-chimiques-acides-metaux', title: 'Action de l\'acide chlorhydrique sur les métaux', tags: ['chimie', 'réactions'] },
      { slug: 'oxydation-metaux-rouille', title: 'Oxydation des métaux dans l\'air et protection', tags: ['chimie', 'oxydation'] },
      { slug: 'loi-ohm-resistance', title: 'Loi d\'Ohm, résistance et énergie électrique', tags: ['électricité', 'résistance'] },
      { slug: 'lentilles-convergentes-images', title: 'Lentilles convergentes et construction d\'images', tags: ['optique', 'lentilles'] },
    ],
    seconde: [
      { slug: 'mouvement-trajectoire-vitesse', title: 'Trajectoire, vitesse et vecteurs position', tags: ['mécanique', 'cinématique'] },
      { slug: 'forces-principe-inertie', title: 'Forces et principe d\'inertie de Newton', tags: ['mécanique', 'Newton'] },
      { slug: 'gravitation-universelle', title: 'Gravitation universelle et pesanteur', tags: ['mécanique', 'gravitation'] },
      { slug: 'elements-chimiques-tableau-periodique', title: 'Structure de l\'atome et classification périodique', tags: ['chimie', 'atome'] },
      { slug: 'mole-quantite-matiere', title: 'La mole, masse molaire et concentration', tags: ['chimie', 'quantité de matière'] },
      { slug: 'reactions-chimiques-bilan', title: 'Transformations chimiques et tableau d\'avancement', tags: ['chimie', 'réactions'] },
      { slug: 'ondes-sonores-lumineuses', title: 'Ondes sonores et lois de Snell-Descartes', tags: ['optique', 'ondes'] },
    ],
    premiere: [
      { slug: 'travail-energie-cinetique', title: 'Travail d\'une force et énergie cinétique', tags: ['mécanique', 'énergie'] },
      { slug: 'energie-potentielle-mecanique', title: 'Énergie potentielle et conservation de l\'énergie mécanique', tags: ['mécanique', 'énergie'] },
      { slug: 'champ-electrostatique', title: 'Champ électrostatique et force de Coulomb', tags: ['électrostatique', 'champs'] },
      { slug: 'champ-magnetique-sources', title: 'Champ magnétique et sources de champ', tags: ['magnétisme', 'champs'] },
      { slug: 'force-laplace-induction', title: 'Force de Laplace et induction électromagnétique', tags: ['électromagnétisme', 'induction'] },
      { slug: 'chimie-organique-alcanes-alcenes', title: 'Hydrocarbures saturés et insaturés (alcanes, alcènes)', tags: ['chimie organique'] },
      { slug: 'alcools-amines', title: 'Composés oxygénés : alcools, aldéhydes et cétones', tags: ['chimie organique'] },
      { slug: 'oxydoreduction-couples', title: 'Réactions d\'oxydoréduction et couples redox', tags: ['chimie', 'redox'] },
      { slug: 'calorimetrie-chaleur', title: 'Échanges thermiques et calorimétrie', tags: ['thermique', 'chaleur'] },
    ],
    terminale: [
      { slug: 'lois-newton-dynamique', title: 'Les trois lois de Newton et dynamique du solide', tags: ['mécanique', 'Newton'] },
      { slug: 'mouvement-champ-pesanteur-uniforme', title: 'Mouvement d\'un projectile dans un champ de pesanteur', tags: ['mécanique', 'balistique'] },
      { slug: 'mouvement-particules-chargees', title: 'Mouvement de particules chargées dans un champ E et B', tags: ['électromagnétisme', 'Lorentz'] },
      { slug: 'oscillateurs-mecaniques-pendules', title: 'Oscillateurs mécaniques libres et amortis', tags: ['mécanique', 'oscillations'] },
      { slug: 'auto-induction-circuit-rl', title: 'Phénomène d\'auto-induction et circuit RL', tags: ['électricité', 'induction'] },
      { slug: 'oscillations-electriques-rlc', title: 'Oscillations électriques libres et forcées (RLC)', tags: ['électricité', 'circuits RLC'] },
      { slug: 'physique-nucleaire-radioactivite', title: 'Noyaux, radioactivité et réactions nucléaires', tags: ['nucléaire', 'radioactivité'] },
      { slug: 'cinetique-chimique-facteurs', title: 'Vitesse de réaction et facteurs cinétiques', tags: ['chimie', 'cinétique'] },
      { slug: 'equilibres-acido-basiques-ph', title: 'Équilibres acido-basiques, pH et constante d\'acidité Ka', tags: ['chimie', 'acides/bases'] },
      { slug: 'dosages-acido-basiques-titrage', title: 'Titrage acido-basique et pH-métrie', tags: ['chimie', 'dosages'] },
      { slug: 'acides-carboxyliques-esters', title: 'Estérification, hydrolyse et saponification', tags: ['chimie organique', 'esters'] },
    ],
  },

  // ─── SCIENCES DE LA VIE ET DE LA TERRE (SVT) ───────────────────────────────
  svt: {
    sixieme: [
      { slug: 'nutrition-plantes-vertes', title: 'La nutrition des plantes chlorophylliennes', tags: ['biologie', 'plantes'] },
      { slug: 'sol-composants-vie', title: 'Le sol : composantes et êtres vivants', tags: ['écologie', 'sol'] },
      { slug: 'environnement-paysages', title: 'La formation des paysages et action de l\'eau', tags: ['géologie', 'eau'] },
    ],
    cinquieme: [
      { slug: 'respiration-etres-vivants', title: 'La respiration dans différents milieux de vie', tags: ['biologie', 'respiration'] },
      { slug: 'nutrition-animaux-regimes', title: 'Les régimes alimentaires et digestion chez les animaux', tags: ['biologie', 'nutrition'] },
      { slug: 'geologie-roches-erosion', title: 'Érosion, transport et sédimentation des roches', tags: ['géologie', 'érosion'] },
    ],
    quatrieme: [
      { slug: 'seismes-propagation-ondes', title: 'Les séismes : failles, magnitude et ondes sismiques', tags: ['géologie', 'séismes'] },
      { slug: 'volcanisme-types-eruptions', title: 'Le volcanisme effusif et explosif', tags: ['géologie', 'volcans'] },
      { slug: 'tectonique-plaques-derive', title: 'La tectonique des plaques et dérive des continents', tags: ['géologie', 'tectonique'] },
      { slug: 'reproduction-sexuee-animaux', title: 'La reproduction sexuée et le maintien des espèces', tags: ['biologie', 'reproduction'] },
    ],
    troisieme: [
      { slug: 'digestion-absorption-nutriments', title: 'Digestion des aliments et absorption intestinale', tags: ['biologie humaine', 'digestion'] },
      { slug: 'circulation-sanguine-coeur', title: 'Le sang, le cœur et la circulation sanguine', tags: ['biologie humaine', 'cœur'] },
      { slug: 'systeme-immunitaire-infections', title: 'Microbes, défenses immunitaires et vaccination', tags: ['immunologie', 'santé'] },
      { slug: 'reproduction-humaine-fecondation', title: 'Appareils reproducteurs humains et fécondation', tags: ['biologie humaine', 'reproduction'] },
      { slug: 'contamination-vih-sida', title: 'Le VIH/SIDA : transmission, dépistage et prévention', tags: ['santé', 'VIH'] },
    ],
    seconde: [
      { slug: 'organisation-cellulaire-unite', title: 'La cellule, unité fondamentale du vivant', tags: ['biologie cellulaire'] },
      { slug: 'adn-information-genetique', title: 'L\'ADN et l\'expression des gènes', tags: ['génétique', 'ADN'] },
      { slug: 'cycle-eau-ressources', title: 'Le cycle de l\'eau et la gestion des ressources hydriques', tags: ['environnement', 'eau'] },
      { slug: 'ecosystemes-forets-savanes', title: 'Les grands écosystèmes tropicaux (forêts et savanes)', tags: ['écologie', 'Côte d\'Ivoire'] },
    ],
    premiere: [
      { slug: 'photosynthese-synthese-matiere', title: 'Mécanismes de la photosynthèse et conversion d\'énergie', tags: ['biologie végétale', 'énergie'] },
      { slug: 'respiration-cellulaire-fermentations', title: 'Respiration cellulaire et fermentations', tags: ['biologie', 'ATP'] },
      { slug: 'systeme-nerveux-reflexes-moelle', title: 'Le réflexe myotatique et le message nerveux', tags: ['neurosciences', 'nerfs'] },
      { slug: 'regulation-glycemie-insuline', title: 'Régulation hormonale de la glycémie (insuline/glucagon)', tags: ['endocrinologie', 'glycémie'] },
      { slug: 'geodynamique-interne-roches-magmatiques', title: 'Magmatisme, métamorphisme et roches de Côte d\'Ivoire', tags: ['géologie', 'roches'] },
    ],
    terminale: [
      { slug: 'genetique-mendelienne-monohybridisme', title: 'Génétique mendélienne : le monohybridisme', tags: ['génétique', 'Mendel'] },
      { slug: 'genetique-dihybridisme-linkage', title: 'Dihybridisme, gènes liés et brassages génétiques', tags: ['génétique', 'brassage'] },
      { slug: 'genetique-humaine-pedigrees', title: 'Génétique humaine et arbres généalogiques', tags: ['génétique humaine', 'maladies'] },
      { slug: 'immunologie-reponses-specifiques', title: 'Réponses immunitaires innée et adaptative (lymphocytes B/T)', tags: ['immunologie'] },
      { slug: 'systeme-nerveux-cerveau-synapses', title: 'Transmission synaptique et fonctionnement cérébral', tags: ['neurosciences', 'synapses'] },
      { slug: 'reproduction-femelle-cycles-hormonaux', title: 'Cycles sexuels chez la femme et régulation hypophysaire', tags: ['endocrinologie', 'reproduction'] },
      { slug: 'geologie-craton-ouest-africain', title: 'Géologie de la Côte d\'Ivoire et ressources minières', tags: ['géologie', 'mines'] },
    ],
  },

  // ─── HISTOIRE-GÉOGRAPHIE ───────────────────────────────────────────────────
  histoire: {
    sixieme: [
      { slug: 'prehistoire-origine-homme', title: 'La Préhistoire : origines et évolution de l\'humanité', tags: ['histoire', 'préhistoire'] },
      { slug: 'civilisation-egypte-antique', title: 'L\'Égypte antique : pharaons, société et Nil', tags: ['histoire', 'antiquité'] },
      { slug: 'geographie-terre-continents', title: 'La Terre, les continents et les océans', tags: ['géographie', 'monde'] },
      { slug: 'peuplements-anciens-cote-ivoire', title: 'Les premiers peuplements de la Côte d\'Ivoire', tags: ['histoire', 'Côte d\'Ivoire'] },
    ],
    cinquieme: [
      { slug: 'grands-empires-afrique-ouest', title: 'Les grands empires ouest-africains (Ghana, Mali, Songhaï)', tags: ['histoire', 'Afrique'] },
      { slug: 'royaumes-cote-ivoire-anciens', title: 'Les peuples et royaumes traditionnels de Côte d\'Ivoire', tags: ['histoire', 'Côte d\'Ivoire'] },
      { slug: 'climat-vegetation-afrique', title: 'Climats et zones de végétation en Afrique', tags: ['géographie', 'Afrique'] },
    ],
    quatrieme: [
      { slug: 'traite-negriere-atlantique', title: 'La traite négrière atlantique et son impact', tags: ['histoire', 'esclavage'] },
      { slug: 'revolution-francaise-droits', title: 'La Révolution française de 1789 et ses idéaux', tags: ['histoire', 'révolution'] },
      { slug: 'revolution-industrielle-essor', title: 'La révolution industrielle au XIXe siècle', tags: ['histoire', 'industrie'] },
      { slug: 'relief-hydrographie-cote-ivoire', title: 'Le relief et le réseau hydrographique ivoirien', tags: ['géographie', 'Côte d\'Ivoire'] },
    ],
    troisieme: [
      { slug: 'conquete-coloniale-resistance-ci', title: 'Pénétration coloniale et résistances en Côte d\'Ivoire', tags: ['histoire', 'colonisation'] },
      { slug: 'systeme-colonial-travail-force', title: 'L\'exploitation coloniale et le travail forcé', tags: ['histoire', 'colonisation'] },
      { slug: 'marche-vers-independance-ci', title: 'La marche vers l\'indépendance de la Côte d\'Ivoire (1944-1960)', tags: ['histoire', 'indépendance'] },
      { slug: 'population-cote-ivoire-dynamique', title: 'La population ivoirienne : dynamique, structure et urbanisation', tags: ['géographie', 'population'] },
      { slug: 'agriculture-ivoirienne-cacao-cafe', title: 'L\'agriculture ivoirienne : atouts et défis (cacao, café, anacarde)', tags: ['géographie', 'agriculture'] },
      { slug: 'premiere-guerre-mondiale-causes', title: 'La Première Guerre mondiale : causes et conséquences', tags: ['histoire', 'guerre'] },
      { slug: 'seconde-guerre-mondiale-bilan', title: 'La Seconde Guerre mondiale et la fondation de l\'ONU', tags: ['histoire', 'guerre'] },
    ],
    seconde: [
      { slug: 'grandes-decouvertes-renaissance', title: 'Les Grandes Découvertes maritimes et la Renaissance', tags: ['histoire', 'Renaissance'] },
      { slug: 'imperialisme-partage-afrique', title: 'L\'impérialisme européen et le partage de l\'Afrique (1885)', tags: ['histoire', 'impérialisme'] },
      { slug: 'milieux-naturels-cote-ivoire', title: 'Les grands domaines bioclimatiques de Côte d\'Ivoire', tags: ['géographie', 'milieux'] },
      { slug: 'activites-economiques-secteur-primaire', title: 'Le secteur primaire et l\'économie agricole ivoirienne', tags: ['géographie', 'économie'] },
    ],
    premiere: [
      { slug: 'crise-1929-totalitarismes', title: 'La crise économique de 1929 et les régimes totalitaires', tags: ['histoire', 'totalitarisme'] },
      { slug: 'seconde-guerre-mondiale-conflit', title: 'La Seconde Guerre mondiale : phases et tournant de 1945', tags: ['histoire', 'WWII'] },
      { slug: 'decolonisation-asie-afrique', title: 'Les mouvements de décolonisation en Afrique et en Asie', tags: ['histoire', 'décolonisation'] },
      { slug: 'industrie-energie-cote-ivoire', title: 'L\'industrie et l\'énergie en Côte d\'Ivoire', tags: ['géographie', 'industrie'] },
      { slug: 'transports-commerce-cote-ivoire', title: 'Les infrastructures de transport et le commerce extérieur ivoirien', tags: ['géographie', 'commerce'] },
    ],
    terminale: [
      { slug: 'relations-internationales-guerre-froide', title: 'Les relations internationales de 1945 à 1991 (Guerre froide)', tags: ['histoire', 'guerre froide'] },
      { slug: 'monde-multipolaire-post-1991', title: 'Le monde après 1991 : nouvel ordre mondial et tensions', tags: ['histoire', 'géopolitique'] },
      { slug: 'afrique-independances-defis', title: 'L\'Afrique face aux défis du développement et de la démocratie', tags: ['histoire', 'Afrique'] },
      { slug: 'la-cote-ivoire-economie-emergence', title: 'La Côte d\'Ivoire : atouts, contraintes et voies vers l\'émergence', tags: ['géographie', 'Côte d\'Ivoire'] },
      { slug: 'puissances-economiques-usa-chine', title: 'Les grandes puissances économiques : USA, Chine et Union Européenne', tags: ['géographie', 'puissances'] },
      { slug: 'mondialisation-flux-inegalites', title: 'La mondialisation : flux, acteurs et inégalités spatiales', tags: ['géographie', 'mondialisation'] },
    ],
  },

  // ─── PHILOSOPHIE ────────────────────────────────────────────────────────────
  philosophie: {
    terminale: [
      { slug: 'nature-et-culture', title: 'Nature et Culture', tags: ['anthropologie', 'culture'] },
      { slug: 'la-conscience-et-inconscient', title: 'La Conscience et l\'Inconscient', tags: ['psychologie', 'Freud'] },
      { slug: 'le-desir-et-passion', title: 'Le Désir et les Passions', tags: ['psychologie', 'éthique'] },
      { slug: 'le-travail-et-la-technique', title: 'Le Travail et la Technique', tags: ['société', 'technique'] },
      { slug: 'l-art-et-esthetique', title: 'L\'Art et l\'Esthétique', tags: ['esthétique', 'création'] },
      { slug: 'la-verite-et-la-connaissance', title: 'La Vérité et les conditions de la Connaissance', tags: ['épistémologie', 'vérité'] },
      { slug: 'la-science-et-la-raison', title: 'La Science, la Raison et l\'Expérience', tags: ['épistémologie', 'science'] },
      { slug: 'l-etat-et-le-pouvoir', title: 'L\'État, le Pouvoir et la Société', tags: ['politique', 'État'] },
      { slug: 'la-liberte-et-le-determinisme', title: 'La Liberté et le Déterminisme', tags: ['éthique', 'liberté'] },
      { slug: 'la-justice-et-le-droit', title: 'La Justice, la Loi et le Droit', tags: ['droit', 'justice'] },
      { slug: 'la-morale-et-le-devoir', title: 'La Morale et le Devoir', tags: ['morale', 'Kant'] },
      { slug: 'la-religion-et-croyance', title: 'La Religion, le Sacré et la Foi', tags: ['métaphysique', 'religion'] },
      { slug: 'histoire-et-devenir-humain', title: 'L\'Histoire et le Devenir de l\'Humanité', tags: ['histoire', 'sens'] },
    ],
  },

  // ─── FRANÇAIS ───────────────────────────────────────────────────────────────
  francais: {
    sixieme: [
      { slug: 'classes-mots-grammaire', title: 'Les classes grammaticales des mots', tags: ['grammaire', 'nature'] },
      { slug: 'fonctions-grammaticales-sujet-cod', title: 'Les fonctions grammaticales : sujet, COD et COI', tags: ['grammaire', 'fonctions'] },
      { slug: 'conjugaison-present-futur-imparfait', title: 'Conjugaison : Présent, Futur et Imparfait', tags: ['conjugaison', 'verbes'] },
      { slug: 'conte-structure-narrative', title: 'Le conte africain : schéma narratif et personnages', tags: ['littérature', 'conte'] },
    ],
    cinquieme: [
      { slug: 'accords-participe-passe', title: 'L\'accord du participe passé avec être et avoir', tags: ['orthographe', 'accords'] },
      { slug: 'passe-simple-recit', title: 'Le passé simple et les temps du récit', tags: ['conjugaison', 'récit'] },
      { slug: 'figures-style-base', title: 'Comparaison, métaphore et personnification', tags: ['stylistique', 'figures'] },
      { slug: 'description-portrait', title: 'Le texte descriptif et le portrait physique/moral', tags: ['expression', 'description'] },
    ],
    quatrieme: [
      { slug: 'propositions-subordonnees-relatives', title: 'Les propositions subordonnées relatives', tags: ['syntaxe', 'phrases complexes'] },
      { slug: 'voix-active-passive', title: 'La voix active et la voix passive', tags: ['grammaire', 'voix'] },
      { slug: 'discours-direct-indirect', title: 'Le discours direct et le discours indirect', tags: ['discours', 'narration'] },
      { slug: 'lettre-correspondance', title: 'La lettre officielle et la lettre personnelle', tags: ['expression', 'lettre'] },
    ],
    troisieme: [
      { slug: 'subordonnees-circonstancielles', title: 'Subordonnées de cause, conséquence et but', tags: ['syntaxe', 'circonstances'] },
      { slug: 'concordance-des-temps', title: 'La concordance des temps et le mode subjonctif', tags: ['conjugaison', 'subjonctif'] },
      { slug: 'figures-style-avancees', title: 'Figures de style : anaphore, hyperbole, antiphrase', tags: ['stylistique', 'rhétorique'] },
      { slug: 'resume-texte-methode', title: 'Méthodologie du résumé de texte pour le BEPC', tags: ['méthodologie', 'résumé'] },
      { slug: 'redaction-texte-argumentatif', title: 'Production écrite : le texte argumentatif', tags: ['expression', 'argumentation'] },
    ],
    premiere: [
      { slug: 'dissertation-litteraire-methode', title: 'Méthodologie de la dissertation littéraire', tags: ['méthode', 'dissertation'] },
      { slug: 'commentaire-compose-methode', title: 'Méthodologie du commentaire composé', tags: ['méthode', 'commentaire'] },
      { slug: 'negritude-poesie-africaine', title: 'Le mouvement de la Négritude (Césaire, Senghor, Damas)', tags: ['littérature', 'Négritude'] },
      { slug: 'roman-africain-engagement', title: 'Le roman africain et l\'engagement social', tags: ['littérature', 'roman'] },
      { slug: 'theatre-classique-moderne', title: 'Le théâtre : de la tragédie classique au drame moderne', tags: ['théâtre', 'dramaturgie'] },
    ],
    terminale: [
      { slug: 'dissertation-litteraire-approfondie', title: 'Dissertation littéraire : problématisation et plan', tags: ['méthode', 'BAC'] },
      { slug: 'commentaire-compose-redaction', title: 'Commentaire composé : analyse stylistique et rédaction', tags: ['méthode', 'BAC'] },
      { slug: 'litterature-africaine-post-independance', title: 'La littérature africaine des indépendances à aujourd\'hui', tags: ['littérature', 'Afrique'] },
      { slug: 'courants-litteraires-humanisme-lumieres', title: 'Humanisme, Classicisme et Philosophie des Lumières', tags: ['littérature', 'histoire littéraire'] },
    ],
  },

  // ─── ANGLAIS ────────────────────────────────────────────────────────────────
  anglais: {
    sixieme: [
      { slug: 'greetings-introductions', title: 'Greetings, Alphabet & Personal Pronouns', tags: ['basics', 'pronouns'] },
      { slug: 'verb-to-be-present', title: 'The Verb \'To Be\' & Simple Present', tags: ['grammar', 'verbs'] },
      { slug: 'numbers-family-school', title: 'Numbers, Family & School Life', tags: ['vocabulary', 'school'] },
    ],
    cinquieme: [
      { slug: 'present-continuous-actions', title: 'Present Continuous & Action Verbs', tags: ['grammar', 'tenses'] },
      { slug: 'have-got-possession', title: '\'Have got\', Possessive Adjectives & Prepositions', tags: ['grammar', 'possession'] },
      { slug: 'food-hobbies-sports', title: 'Food, Hobbies, Likes & Dislikes', tags: ['vocabulary', 'lifestyle'] },
    ],
    quatrieme: [
      { slug: 'simple-past-regular-irregular', title: 'Simple Past (Regular & Irregular Verbs)', tags: ['grammar', 'past'] },
      { slug: 'comparatives-superlatives', title: 'Comparatives & Superlatives', tags: ['grammar', 'adjectives'] },
      { slug: 'modal-verbs-can-must', title: 'Modal Verbs (Can, Must, Should)', tags: ['grammar', 'modals'] },
    ],
    troisieme: [
      { slug: 'present-perfect-since-for', title: 'Present Perfect with \'Since\' and \'For\'', tags: ['grammar', 'tenses'] },
      { slug: 'future-tenses-will-going-to', title: 'Expressing the Future (Will, Be Going To)', tags: ['grammar', 'future'] },
      { slug: 'passive-voice-basics', title: 'Introduction to Passive Voice', tags: ['grammar', 'passive'] },
      { slug: 'reading-comprehension-bepc', title: 'Reading Comprehension & BEPC Exam Practice', tags: ['skills', 'BEPC'] },
    ],
    seconde: [
      { slug: 'past-continuous-vs-simple-past', title: 'Past Continuous vs Simple Past', tags: ['grammar', 'tenses'] },
      { slug: 'relative-pronouns-who-which-where', title: 'Relative Clauses (Who, Which, That, Where)', tags: ['grammar', 'clauses'] },
      { slug: 'conditional-type-1-2', title: 'Conditionals (Type 1 & Type 2)', tags: ['grammar', 'conditionals'] },
      { slug: 'culture-traditions-west-africa', title: 'Culture, Traditions & Festivals in West Africa', tags: ['vocabulary', 'culture'] },
    ],
    premiere: [
      { slug: 'past-perfect-narrative', title: 'Past Perfect & Narrative Sequences', tags: ['grammar', 'tenses'] },
      { slug: 'passive-voice-advanced', title: 'Advanced Passive Voice Structures', tags: ['grammar', 'passive'] },
      { slug: 'conditional-type-3-wishes', title: 'Conditional Type 3 & Expressing Regrets', tags: ['grammar', 'conditionals'] },
      { slug: 'technology-social-media', title: 'Technology, Digital World & Social Media', tags: ['vocabulary', 'tech'] },
    ],
    terminale: [
      { slug: 'complex-sentence-connectors', title: 'Discourse Markers & Complex Sentence Linkers', tags: ['grammar', 'linkers'] },
      { slug: 'modal-verbs-past-deduction', title: 'Modals of Deduction in the Past (Must have, Can\'t have)', tags: ['grammar', 'modals'] },
      { slug: 'essay-writing-argumentative', title: 'Formal Essay Writing & Argumentation (BAC exam)', tags: ['writing', 'BAC'] },
      { slug: 'global-issues-globalization', title: 'Global Issues: Climate, Development & Globalization', tags: ['vocabulary', 'globalization'] },
    ],
  },

  // ─── INFORMATIQUE / TICE ────────────────────────────────────────────────────
  info: {
    sixieme: [
      { slug: 'decouverte-ordinateur', title: 'Découverte de l\'ordinateur et des périphériques', tags: ['matériel', 'bases'] },
      { slug: 'souris-clavier-bureau', title: 'Utilisation de la souris, du clavier et du bureau', tags: ['pratique', 'système'] },
    ],
    cinquieme: [
      { slug: 'gestion-fichiers-dossiers', title: 'Gestion et organisation des fichiers et dossiers', tags: ['système', 'stockage'] },
      { slug: 'traitement-texte-initiation', title: 'Initiation au traitement de texte (saisie et mise en page)', tags: ['bureautique', 'Word'] },
    ],
    quatrieme: [
      { slug: 'tableur-calculs-formules', title: 'Découverte du tableur : cellules, calculs et formules', tags: ['bureautique', 'Excel'] },
      { slug: 'navigation-recherche-internet', title: 'Internet, moteurs de recherche et règles de sécurité', tags: ['internet', 'web'] },
    ],
    troisieme: [
      { slug: 'algorithmique-notions-base', title: 'Notions d\'algorithme : instructions et organigrammes', tags: ['algorithmique', 'logique'] },
      { slug: 'presentation-diaporama', title: 'Création d\'un diaporama multimédia', tags: ['bureautique', 'PowerPoint'] },
      { slug: 'securite-donnees-ethique', title: 'Protection des données et citoyenneté numérique', tags: ['sécurité', 'éthique'] },
    ],
    seconde: [
      { slug: 'algorithmes-pseudo-code', title: 'Algorithmes : variables, conditions et boucles', tags: ['algorithmique', 'pseudo-code'] },
      { slug: 'initiation-python-bases', title: 'Initiation à Python : variables, types et opérations', tags: ['programmation', 'Python'] },
      { slug: 'architecture-ordinateurs-codage', title: 'Codage binaire de l\'information et architecture matérielle', tags: ['architecture', 'binaire'] },
    ],
    premiere: [
      { slug: 'programmation-python-fonctions', title: 'Python : fonctions, listes et dictionnaires', tags: ['programmation', 'Python'] },
      { slug: 'bases-donnees-sql', title: 'Bases de données relationnelles et requêtes SQL', tags: ['bases de données', 'SQL'] },
      { slug: 'reseaux-informatiques-ip', title: 'Réseaux informatiques, adressage IP et modèle Internet', tags: ['réseaux', 'IP'] },
    ],
    terminale: [
      { slug: 'algorithmique-structures-donnees', title: 'Structures de données : piles, files, arbres et graphes', tags: ['structures', 'algorithmique'] },
      { slug: 'programmation-web-html-css-js', title: 'Développement Web : HTML5, CSS3 et JavaScript', tags: ['web', 'frontend'] },
      { slug: 'cybersecurite-cryptographie', title: 'Cybersécurité, cryptographie et notions d\'IA', tags: ['sécurité', 'IA'] },
    ],
    prepa1: [
      { slug: 'structures-avancees', title: 'Structures de données avancées et complexité', tags: ['données', 'algorithmique'] },
      { slug: 'complexite-avancee', title: 'Analyse asymptotique et classes de complexité (P, NP)', tags: ['complexité', 'théorie'] },
      { slug: 'automates', title: 'Automates finis et langages formels', tags: ['théorie', 'langages'] },
      { slug: 'logique', title: 'Logique propositionnelle et calcul des prédicats', tags: ['logique', 'mathématiques'] },
    ],
    prepa2: [
      { slug: 'algorithmes-avances', title: 'Algorithmes avancés sur les graphes et optimisation', tags: ['algorithmique', 'graphes'] },
      { slug: 'calculabilite', title: 'Calculabilité, machines de Turing et décidabilité', tags: ['théorie', 'calcul'] },
      { slug: 'compilation', title: 'Principes de compilation et analyse syntaxique', tags: ['langages', 'compilation'] },
    ],
  },

  // ─── ESPAGNOL ───────────────────────────────────────────────────────────────
  espagnol: {
    seconde: [
      { slug: 'presente-indicativo', title: 'Presente de indicativo (verbos regulares e irregulares)', tags: ['gramática', 'verbos'] },
      { slug: 'pasado-preterito', title: 'Pretérito indefinido y pretérito perfecto', tags: ['gramática', 'pasado'] },
      { slug: 'vocabulario-vida-cotidiana', title: 'Vocabulario : Vida cotidiana, familia y escuela', tags: ['vocabulario', 'vida diaria'] },
    ],
    premiere: [
      { slug: 'subjuntivo', title: 'El subjuntivo presente (formación y usos)', tags: ['gramática', 'subjuntivo'] },
      { slug: 'condicional', title: 'El condicional simple y la hipótesis', tags: ['gramática', 'condicional'] },
      { slug: 'vocabulario-sociedad', title: 'Vocabulario : Sociedad, tradiciones y juventud', tags: ['vocabulario', 'sociedad'] },
    ],
    terminale: [
      { slug: 'pluscuamperfecto', title: 'Tiempos del pasado : Pluscuamperfecto e Imperfecto de subjuntivo', tags: ['gramática', 'avanzado'] },
      { slug: 'oraciones-complejas', title: 'Oraciones complejas y conectores de argumentación', tags: ['redacción', 'conectores'] },
      { slug: 'mundo-hispanico-retos', title: 'El mundo hispánico : historia, cultura y desafíos contemporáneos', tags: ['cultura', 'BAC'] },
    ],
  },

  // ─── ALLEMAND ───────────────────────────────────────────────────────────────
  allemand: {
    seconde: [
      { slug: 'kasus-nominativ', title: 'Kasus : Nominativ und Akkusativ', tags: ['grammatik', 'kasus'] },
      { slug: 'praesens', title: 'Präsens der regelmäßigen und unregelmäßigen Verben', tags: ['grammatik', 'verben'] },
      { slug: 'alltag-familie', title: 'Wortschatz : Alltag, Familie und Schule', tags: ['wortschatz', 'alltag'] },
    ],
    premiere: [
      { slug: 'kasus-dativ', title: 'Kasus : Dativ und Genitiv', tags: ['grammatik', 'kasus'] },
      { slug: 'praeteritum-perfekt', title: 'Vergangenheit : Präteritum und Perfekt', tags: ['grammatik', 'vergangenheit'] },
      { slug: 'kultur-gesellschaft', title: 'Wortschatz : Gesellschaft, Umwelt und Medien', tags: ['wortschatz', 'gesellschaft'] },
    ],
    terminale: [
      { slug: 'passiv', title: 'Das Passiv im Präsens und Präteritum', tags: ['grammatik', 'passiv'] },
      { slug: 'konjunktiv', title: 'Konjunktiv II (Wünsche und Höflichkeit)', tags: ['grammatik', 'konjunktiv'] },
      { slug: 'textarbeit-argumentation', title: 'Textarbeit, Aufsatz und Argumentation (BAC)', tags: ['schreiben', 'BAC'] },
    ],
  },
}

// Helper pour récupérer les cours d'une matière/niveau
export function getSyllabus(subject, level) {
  return SYLLABUS[subject]?.[level] || []
}

// Helper pour lister toutes les matières
export function getSubjects() {
  return Object.keys(SYLLABUS)
}

// Helper pour lister tous les niveaux d'une matière
export function getLevels(subject) {
  return Object.keys(SYLLABUS[subject] || {})
}

// Helper pour compter le nombre total de cours disponibles
export function countTotalCourses() {
  let count = 0
  for (const subject in SYLLABUS) {
    for (const level in SYLLABUS[subject]) {
      count += SYLLABUS[subject][level].length
    }
  }
  return count
}

// Génère un cours aléatoire manquant (pour le script de génération)
export function getRandomMissingCourse(existingCourses) {
  const missing = []
  
  for (const subject in SYLLABUS) {
    for (const level in SYLLABUS[subject]) {
      for (const course of SYLLABUS[subject][level]) {
        const courseId = `${subject}-${level}-${course.slug}`
        if (!existingCourses.has(courseId)) {
          missing.push({ subject, level, ...course })
        }
      }
    }
  }
  
  if (missing.length === 0) return null
  return missing[Math.floor(Math.random() * missing.length)]
}

export default SYLLABUS

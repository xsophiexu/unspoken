// Generated from the design canvas palettes, then shaded (same hue, new lightness) wherever text
// missed WCAG AA. test/contrast.test.ts keeps every text pair at 4.5:1 or better; when you edit a
// value, run the tests and darken or lighten the same hue until they pass.

// Customize lists the colors in this order.
export const COLOR_IDS = ['teal', 'clay', 'lilac', 'sage', 'mustard', 'slateBlue', 'rose'] as const;
export type ColorId = (typeof COLOR_IDS)[number];

export const COLOR_MODES = ['light', 'dark'] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

export type ColorRoles = {
  /** Full-page settings screens (Customize, Send feedback, Thanks). */
  canvas: string;
  /** The game screen and bottom sheets. */
  bg: string;
  /** Tiles, menu rows, unselected options, the Card word tile. */
  surface: string;
  /** Chips on a surface, inputs, the Deck card. */
  surfaceRaised: string;
  /** Primary text and icons. */
  ink: string;
  /** Secondary text: sublines, hints, section labels. */
  muted: string;
  /** Primary buttons, selected options, the level badge, timer progress. */
  accent: string;
  /** Text and icons on accent. */
  onAccent: string;
  /** Secondary text on accent. */
  onAccentMuted: string;
  /** Accent-colored text on bg and surfaces: Correct →, links, the Worth pill. */
  accentText: string;
  /** Borders of secondary buttons and dashed suggestion tiles. */
  outline: string;
  /** Hairlines between rows. */
  rule: string;
  /** The unfilled part of timer rings and bars. */
  track: string;
  /** The Skip bar at rest. */
  barIdle: string;
  /** The Skip bar while the card is dragged left. */
  barSkip: string;
  /** The contrasting panel: Ink and Bottom lower panels, split-bar Correct, the Ombre footer. */
  panel: string;
  /** Text and icons on panel. */
  onPanel: string;
  /** Secondary text on panel. */
  onPanelMuted: string;
  /** Backdrop behind sheets (8-digit hex with alpha). */
  scrim: string;
  /** Ombre bands from lightest to strongest, each with its text color. */
  ramp: readonly RampBand[];
};

export type ColorRole = Exclude<keyof ColorRoles, 'ramp'>;

export type RampBand = { bg: string; ink: string };

export type Palette = {
  /** The dot on Customize. Accent can be a shade darker so white text on it passes AA. */
  swatch: string;
  light: ColorRoles;
  dark: ColorRoles;
};

export const palettes: Readonly<Record<ColorId, Palette>> = {
  teal: {
    swatch: '#3F7470',
    light: {
      canvas: '#F1F5F4',
      bg: '#E2E8E7',
      surface: '#CCDCDA',
      surfaceRaised: '#FFFFFF',
      ink: '#24393A',
      muted: '#506161',
      accent: '#3F7470',
      onAccent: '#FFFFFF',
      onAccentMuted: '#EDF2F1',
      accentText: '#2C5E5A',
      outline: '#8FA5A3',
      rule: '#CAD6D4',
      track: '#C3D3D1',
      barIdle: '#D3DEDC',
      barSkip: '#8A9E9C',
      panel: '#273B3C',
      onPanel: '#E8EFEE',
      onPanelMuted: '#9FB3B1',
      scrim: '#141E1E59',
      ramp: [{ bg: '#D2E3E2', ink: '#213332' }, { bg: '#C3D9D6', ink: '#213332' }, { bg: '#B1CDCA', ink: '#213332' }, { bg: '#7AA7A3', ink: '#132B29' }, { bg: '#4F7C78', ink: '#FFFFFF' }, { bg: '#427470', ink: '#ECF6F5' }],
    },
    dark: {
      canvas: '#101717',
      bg: '#141C1C',
      surface: '#22302F',
      surfaceRaised: '#334644',
      ink: '#E4ECEB',
      muted: '#A0B3B1',
      accent: '#5FA39D',
      onAccent: '#0F1717',
      onAccentMuted: '#132E2B',
      accentText: '#8CCBC4',
      outline: '#4A5E5C',
      rule: '#273534',
      track: '#2A3837',
      barIdle: '#2F3D3C',
      barSkip: '#5E7472',
      panel: '#0C1313',
      onPanel: '#E4ECEB',
      onPanelMuted: '#93A6A4',
      scrim: '#00000099',
      ramp: [{ bg: '#26302F', ink: '#E4ECEB' }, { bg: '#2E3D3B', ink: '#E4ECEB' }, { bg: '#364948', ink: '#E4ECEB' }, { bg: '#385855', ink: '#E4ECEB' }, { bg: '#436562', ink: '#E4ECEB' }, { bg: '#4D736F', ink: '#E9F1F0' }],
    },
  },
  clay: {
    swatch: '#A9634B',
    light: {
      canvas: '#FBF7F4',
      bg: '#F6EEE8',
      surface: '#EBD2CA',
      surfaceRaised: '#FFFFFF',
      ink: '#3A2C27',
      muted: '#6E5950',
      accent: '#A05A42',
      onAccent: '#FFFFFF',
      onAccentMuted: '#F7EFEC',
      accentText: '#7F402A',
      outline: '#C9AFA3',
      rule: '#E8DAD2',
      track: '#E2C9C1',
      barIdle: '#E8D7D1',
      barSkip: '#AF9287',
      panel: '#4A2F26',
      onPanel: '#F6EBE7',
      onPanelMuted: '#C5A79C',
      scrim: '#26181359',
      ramp: [{ bg: '#F3D9D0', ink: '#42281F' }, { bg: '#ECCBC0', ink: '#42281F' }, { bg: '#E5BCAD', ink: '#42281F' }, { bg: '#C98B76', ink: '#3C1D12' }, { bg: '#9C604C', ink: '#FFFFFF' }, { bg: '#965640', ink: '#FEF0EB' }],
    },
    dark: {
      canvas: '#1D130F',
      bg: '#231713',
      surface: '#3B2721',
      surfaceRaised: '#553A31',
      ink: '#F4E7E3',
      muted: '#C4A69D',
      accent: '#D2795B',
      onAccent: '#1D120E',
      onAccentMuted: '#401E12',
      accentText: '#FBA486',
      outline: '#6E5248',
      rule: '#402C26',
      track: '#432F29',
      barIdle: '#48342E',
      barSkip: '#86665C',
      panel: '#190F0B',
      onPanel: '#F4E7E3',
      onPanelMuted: '#B79A91',
      scrim: '#00000099',
      ramp: [{ bg: '#392A24', ink: '#F4E7E3' }, { bg: '#48342D', ink: '#F4E7E3' }, { bg: '#593D34', ink: '#F4E7E3' }, { bg: '#704435', ink: '#F4E7E3' }, { bg: '#7E5040', ink: '#F4E7E3' }, { bg: '#8F5B4A', ink: '#F4E7E3' }],
    },
  },
  lilac: {
    swatch: '#7E6385',
    light: {
      canvas: '#F5F3F6',
      bg: '#ECE8EE',
      surface: '#DCCFE0',
      surfaceRaised: '#FFFFFF',
      ink: '#33283A',
      muted: '#625668',
      accent: '#7D6284',
      onAccent: '#FFFFFF',
      onAccentMuted: '#F3EDF5',
      accentText: '#664F6D',
      outline: '#A597AA',
      rule: '#DCD3DF',
      track: '#D6CCD9',
      barIdle: '#DDD3E1',
      barSkip: '#9C8EA2',
      panel: '#3D3240',
      onPanel: '#F0ECF1',
      onPanelMuted: '#B5AAB8',
      scrim: '#1F1A2059',
      ramp: [{ bg: '#E5DBE8', ink: '#352B38' }, { bg: '#DBCEDE', ink: '#352B38' }, { bg: '#D0C0D4', ink: '#352B38' }, { bg: '#AB93B1', ink: '#2D2131' }, { bg: '#806886', ink: '#FFFFFF' }, { bg: '#785F7F', ink: '#F7F1F8' }],
    },
    dark: {
      canvas: '#181419',
      bg: '#1D181E',
      surface: '#312A33',
      surfaceRaised: '#483D4B',
      ink: '#EDE8EE',
      muted: '#B5A9B8',
      accent: '#A986B2',
      onAccent: '#181319',
      onAccentMuted: '#302334',
      accentText: '#D1AFDA',
      outline: '#605563',
      rule: '#362F38',
      track: '#39323B',
      barIdle: '#3E3740',
      barSkip: '#766A79',
      panel: '#141015',
      onPanel: '#EDE8EE',
      onPanelMuted: '#A89DAB',
      scrim: '#00000099',
      ramp: [{ bg: '#312B33', ink: '#EDE8EE' }, { bg: '#3E3640', ink: '#EDE8EE' }, { bg: '#4B414E', ink: '#EDE8EE' }, { bg: '#5B4A60', ink: '#EDE8EE' }, { bg: '#68566D', ink: '#EDE8EE' }, { bg: '#76627B', ink: '#EDE8EE' }],
    },
  },
  sage: {
    swatch: '#5F7859',
    light: {
      canvas: '#F3F5F2',
      bg: '#E4E9E2',
      surface: '#D2DCCD',
      surfaceRaised: '#FFFFFF',
      ink: '#2C3A2A',
      muted: '#556152',
      accent: '#5B7455',
      onAccent: '#FFFFFF',
      onAccentMuted: '#EEF3EC',
      accentText: '#475E44',
      outline: '#97A693',
      rule: '#CFD5CD',
      track: '#C8D3C3',
      barIdle: '#D6DED2',
      barSkip: '#8D9C89',
      panel: '#3E5240',
      onPanel: '#EEF2EB',
      onPanelMuted: '#B7C2B5',
      scrim: '#191D1759',
      ramp: [{ bg: '#DBE2D6', ink: '#26332A' }, { bg: '#CDD7C8', ink: '#26332A' }, { bg: '#BECBB8', ink: '#26332A' }, { bg: '#8FA488', ink: '#1F2A1C' }, { bg: '#64795E', ink: '#FFFFFF' }, { bg: '#5A7154', ink: '#F1F5EE' }],
    },
    dark: {
      canvas: '#131712',
      bg: '#181C17',
      surface: '#282F26',
      surfaceRaised: '#3B4539',
      ink: '#E7EBE6',
      muted: '#A8B2A5',
      accent: '#7F9F77',
      onAccent: '#131712',
      onAccentMuted: '#202D1D',
      accentText: '#A8C7A1',
      outline: '#535D50',
      rule: '#2D342B',
      track: '#30372E',
      barIdle: '#353C33',
      barSkip: '#677365',
      panel: '#0F130E',
      onPanel: '#E7EBE6',
      onPanelMuted: '#9BA598',
      scrim: '#00000099',
      ramp: [{ bg: '#2A3029', ink: '#E7EBE6' }, { bg: '#343C33', ink: '#E7EBE6' }, { bg: '#3F483C', ink: '#E7EBE6' }, { bg: '#475643', ink: '#E7EBE6' }, { bg: '#53634F', ink: '#E7EBE6' }, { bg: '#5E715A', ink: '#ECF0EB' }],
    },
  },
  mustard: {
    swatch: '#9C7A36',
    light: {
      canvas: '#F6F4EF',
      bg: '#EAE6DF',
      surface: '#E2D7C3',
      surfaceRaised: '#FFFFFF',
      ink: '#403219',
      muted: '#685C46',
      accent: '#896723',
      onAccent: '#FFFFFF',
      onAccentMuted: '#F4F0EA',
      accentText: '#6D4E02',
      outline: '#AD9E83',
      rule: '#DAD2C3',
      track: '#D9CEBA',
      barIdle: '#E2DACD',
      barSkip: '#A5977F',
      panel: '#42351C',
      onPanel: '#F2EDE4',
      onPanelMuted: '#BAAC94',
      scrim: '#211B0F59',
      ramp: [{ bg: '#EADEC9', ink: '#3A2D16' }, { bg: '#E0D1B7', ink: '#3A2D16' }, { bg: '#D7C4A1', ink: '#3A2D16' }, { bg: '#B59862', ink: '#332404' }, { bg: '#8A6D35', ink: '#FFFFFF' }, { bg: '#836424', ink: '#F9F3E7' }],
    },
    dark: {
      canvas: '#19150C',
      bg: '#1F1910',
      surface: '#352B1A',
      surfaceRaised: '#4C4028',
      ink: '#EFE9E0',
      muted: '#BAAD96',
      accent: '#B88D33',
      onAccent: '#1A140B',
      onAccentMuted: '#362501',
      accentText: '#E0B667',
      outline: '#65573F',
      rule: '#3A301F',
      track: '#3D3322',
      barIdle: '#423827',
      barSkip: '#7C6D52',
      panel: '#151108',
      onPanel: '#EFE9E0',
      onPanelMuted: '#ADA089',
      scrim: '#00000099',
      ramp: [{ bg: '#342D20', ink: '#EFE9E0' }, { bg: '#413826', ink: '#EFE9E0' }, { bg: '#50432B', ink: '#EFE9E0' }, { bg: '#634E25', ink: '#EFE9E0' }, { bg: '#705A30', ink: '#EFE9E0' }, { bg: '#7F6637', ink: '#EFE9E0' }],
    },
  },
  slateBlue: {
    swatch: '#586E83',
    light: {
      canvas: '#F2F4F6',
      bg: '#E6E9EC',
      surface: '#D3D9DF',
      surfaceRaised: '#FFFFFF',
      ink: '#22303F',
      muted: '#575F67',
      accent: '#586E83',
      onAccent: '#FFFFFF',
      onAccentMuted: '#EFF1F3',
      accentText: '#42576A',
      outline: '#97A1AB',
      rule: '#CED4D9',
      track: '#C9D1D9',
      barIdle: '#D7DCE1',
      barSkip: '#919AA3',
      panel: '#22303F',
      onPanel: '#E8EDF2',
      onPanelMuted: '#8FA0B1',
      scrim: '#181C2159',
      ramp: [{ bg: '#D9E0E8', ink: '#283038' }, { bg: '#CBD5DF', ink: '#283038' }, { bg: '#BBC8D5', ink: '#283038' }, { bg: '#8C9FB2', ink: '#1E2831' }, { bg: '#617487', ink: '#FFFFFF' }, { bg: '#576C80', ink: '#F0F4F9' }],
    },
    dark: {
      canvas: '#131619',
      bg: '#171B1E',
      surface: '#272E34',
      surfaceRaised: '#3A434B',
      ink: '#E7EAEE',
      muted: '#A7B0B8',
      accent: '#7C98B4',
      onAccent: '#121619',
      onAccentMuted: '#1F2A34',
      accentText: '#A5C0DB',
      outline: '#525B63',
      rule: '#2C3339',
      track: '#2F363C',
      barIdle: '#343B41',
      barSkip: '#66707A',
      panel: '#0F1215',
      onPanel: '#E7EAEE',
      onPanelMuted: '#9AA3AB',
      scrim: '#00000099',
      ramp: [{ bg: '#2A2E33', ink: '#E7EAEE' }, { bg: '#343A40', ink: '#E7EAEE' }, { bg: '#3E464E', ink: '#E7EAEE' }, { bg: '#455360', ink: '#E7EAEE' }, { bg: '#515F6E', ink: '#E7EAEE' }, { bg: '#5C6C7C', ink: '#E9ECF0' }],
    },
  },
  rose: {
    swatch: '#A8667E',
    light: {
      canvas: '#F8F2F4',
      bg: '#F1E6EA',
      surface: '#E5D0D8',
      surfaceRaised: '#FFFFFF',
      ink: '#4A2C37',
      muted: '#6E555D',
      accent: '#9C5A72',
      onAccent: '#FFFFFF',
      onAccentMuted: '#FAF0F3',
      accentText: '#854A5F',
      outline: '#BC9DA8',
      rule: '#DFCED3',
      track: '#E0C9D1',
      barIdle: '#E8D8DE',
      barSkip: '#B0939D',
      panel: '#482E37',
      onPanel: '#F5EAED',
      onPanelMuted: '#C2A5AE',
      scrim: '#25171C59',
      ramp: [{ bg: '#F0D8DF', ink: '#3F2730' }, { bg: '#E9CAD4', ink: '#3F2730' }, { bg: '#E1BAC7', ink: '#3F2730' }, { bg: '#C3899D', ink: '#391C27' }, { bg: '#975F73', ink: '#FFFFFF' }, { bg: '#90546A', ink: '#FEEFF4' }],
    },
    dark: {
      canvas: '#1C1216',
      bg: '#21171A',
      surface: '#39272D',
      surfaceRaised: '#533942',
      ink: '#F2E7EA',
      muted: '#C1A5AE',
      accent: '#CA7796',
      onAccent: '#1C1215',
      onAccentMuted: '#3D1D29',
      accentText: '#F2A1BE',
      outline: '#6C515A',
      rule: '#3E2C32',
      track: '#412F35',
      barIdle: '#47343A',
      barSkip: '#83656F',
      panel: '#180E12',
      onPanel: '#F2E7EA',
      onPanelMuted: '#B499A2',
      scrim: '#00000099',
      ramp: [{ bg: '#38292E', ink: '#F2E7EA' }, { bg: '#463339', ink: '#F2E7EA' }, { bg: '#563D45', ink: '#F2E7EA' }, { bg: '#6C4352', ink: '#F2E7EA' }, { bg: '#7A4F5E', ink: '#F2E7EA' }, { bg: '#8A5A6B', ink: '#F2E7EA' }],
    },
  },
};

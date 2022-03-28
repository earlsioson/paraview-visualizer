import { floatToHex2, debounce, areEquals } from '../../utils';

let COUNT = 1;

// Nested properties:
// => AmbientColor, ColorArrayName, DiffuseColor, LookupTable, UseSeparateColorMap
export default {
  name: 'swColorEditor',
  props: {
    label: {
      type: String,
      default: 'Coloring',
    },
    mtime: {
      type: Number,
    },
  },
  created() {
    this.onUpdateUI = () => {
      const newValue = `__ColorEditor_${COUNT}__${this.uiTS()}`;
      if (this.tsKey !== newValue) {
        this.$nextTick(() => {
          this.tsKey = newValue;
        });
      }
    };
    this.simputChannel.$on('templateTS', this.onUpdateUI);
    this.flushSolidColorToServer = debounce(() => {
      // May have an issue for beeing 2 calls instead of just 1!
      this.dirtyMany('AmbientColor', 'DiffuseColor');
    }, 100);
  },
  mounted() {
    COUNT++;
    this.onUpdateUI();
  },
  beforeDestroy() {
    this.simputChannel.$off('templateTS', this.onUpdateUI);
  },
  data() {
    return {
      tsKey: '__default__',
      componentMode: 'Magnitude',
    };
  },
  watch: {
    componentMode() {
      this.updateColorBy();
    },
  },
  computed: {
    arrayMap() {
      this.mtime; // force refresh
      const arrayMap = { 'Solid Color': { value: ['', '', '', '0', ''] } };
      const list = this.domains()?.ColorArrayName?.array_list?.available || [];
      for (let i = 0; i < list.length; i++) {
        const { text, value, components } = list[i];
        arrayMap[text] = { value, components };
      }
      return arrayMap;
    },
    componentOptions() {
      return this.arrayMap[this.colorMode]?.components;
    },
    colorOptions() {
      this.mtime; // force refresh
      const list = this.domains()?.ColorArrayName?.array_list?.available || [];
      const names = list.map(({ text }) => text);
      return ['Solid Color', ...names];
    },
    colorMode: {
      get() {
        this.mtime; // force refresh
        const fieldName = this.properties().ColorArrayName[4];
        if (fieldName.length) {
          return fieldName;
        }
        return 'Solid Color';
      },
      set(name) {
        this.properties().ColorArrayName = this.arrayMap[name]?.value;
        this.dirty('ColorArrayName');
        this.updateColorBy();
      },
    },
    solidColor: {
      get() {
        // AmbientColor, DiffuseColor
        const value = this.properties() && this.properties().AmbientColor;
        if (!value) {
          return '#FFFFFF';
        }
        return `#${floatToHex2(value[0])}${floatToHex2(value[1])}${floatToHex2(
          value[2]
        )}`;
      },
      set(hexStr) {
        const colorFloat = [
          parseInt(hexStr.substr(1, 2), 16) / 255,
          parseInt(hexStr.substr(3, 2), 16) / 255,
          parseInt(hexStr.substr(5, 2), 16) / 255,
        ];
        if (!areEquals(this.properties().AmbientColor, colorFloat)) {
          this.properties().AmbientColor = colorFloat;
          this.properties().DiffuseColor = colorFloat;
          this.flushSolidColorToServer();
        }
      },
    },
  },
  methods: {
    updateColorBy() {
      const field = this.properties().ColorArrayName;
      const name = field[4];
      const association = Number(field[3]);
      let component = this.componentOptions
        ? this.componentOptions.indexOf(this.componentMode)
        : -1;
      if (component !== -1) {
        component--;
      } else {
        this.componentMode = 'Magnitude';
      }

      if (name) {
        this.trigger('pv_reaction_representation_color_by', [
          [name, association, component],
        ]);
      } else {
        this.trigger('pv_reaction_representation_color_by');
      }
    },
  },
  inject: [
    'data',
    'properties',
    'domains',
    'dirty',
    'dirtyMany',
    'getSimput',
    'uiTS',
    'simputChannel',
    'trigger',
  ],
};

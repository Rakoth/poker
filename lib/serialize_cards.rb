module SerializeCards
	# переопределяем rails-овские методы доступа к отрибутам
	# теперь в self[:deck] храниться сериализованный объект Poker::Deck
	# a self.deck ссылается на @deck, в котором лежит загруженный из строки объект Poker::Deck
	def self.included(klass)
		class << klass
			def serialized_cards
				@serialized_cards ||= {}
			end
			
			def serialize_cards field, klass = Poker::Hand
				serialized_cards[field] = klass
				attr_accessor field
			end
		end
	end


	def after_initialize
		self.class.serialized_cards.each do |attribute_name, attribute_class|
			attr_value = self[attribute_name]
			unless attr_value.nil?
				send("#{attribute_name}=", attribute_class.load(attr_value))
			end
		end
	end

	def before_save
		self.class.serialized_cards.each do |attribute_name, attribute_class|
			attr_value = send(attribute_name)
			self[attribute_name] = (attr_value.nil? ? nil : attr_value.dump)
		end
	end
end

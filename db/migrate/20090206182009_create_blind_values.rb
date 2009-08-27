class CreateBlindValues < ActiveRecord::Migration
  def self.up
    create_table :blind_values do |t|
      t.integer :level
      t.integer :value
      t.integer :ante
      t.references :game_type
    end
  end

  def self.down
    drop_table :blind_values
  end
end
